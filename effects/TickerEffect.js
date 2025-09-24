// effects/TickerEffect.js
import { BaseEffect } from './BaseEffect.js';
import { BoxElement } from '../elements/BoxElement.js';
import { RichTextElement } from '../elements/RichTextElement.js';
import { SoundElement } from '../elements/SoundElement.js';
import { TimedSlideBehavior } from '../behaviors/TimedSlideBehavior.js';
import { TextScrollBehavior } from '../behaviors/TextScrollBehavior.js';
import { SoundOnPlayBehavior } from '../behaviors/SoundOnPlayBehavior.js';

// Ticker effect states
const TICKER_STATES = {
    BOX_SLIDING_UP: 'BOX_SLIDING_UP',
    TEXT_SCROLLING: 'TEXT_SCROLLING',
    BOX_SLIDING_DOWN: 'BOX_SLIDING_DOWN',
    FINISHED: 'Finished'
};

export class TickerEffect extends BaseEffect {
    constructor({ W, H, message = '', cleanMessage = '', emotes = [] }) {
        // Use a reasonable duration estimate for the effect manager
        super({ W, H, duration: 30000 }); // 30 seconds should be more than enough
        
        // Use cleanMessage if available (message with !ticker prefix removed), otherwise fall back to message
        this.message = cleanMessage || message;
        this.emotes = emotes;
        this.W = W;
        this.H = H;
        
        // Ticker configuration
        this.TICKER_HEIGHT = 80;
        this.TICKER_Y_POSITION = H - this.TICKER_HEIGHT; // Position from bottom
        this.BOX_SLIDE_DURATION = 500; // Time for box to slide up/down in ms
        this.TEXT_SCROLL_SPEED = 300; // pixels per second
        
        // Text scrolling timer
        this.textScrollingElapsed = 0;
        
        // State management
        this.state = TICKER_STATES.BOX_SLIDING_UP;
        this.isInitialized = false;
        
        // Behavior references
        this.boxSlideBehavior = null;
        this.textScrollBehavior = null;
        
        // Create the ticker elements
        this.createTickerElements();
    }
    
    createTickerElements() {
        const boxPadding = 100; // Extra width on each side to hide borders
        
        // Create the background box (wider than screen to hide left/right borders)
        this.tickerBox = new BoxElement({
            x: -boxPadding,
            y: this.H, // Start below screen
            width: this.W + (boxPadding * 2),
            height: this.TICKER_HEIGHT,
            fillColor: '#dd68caff',
            borderTopColor: '#630052ff',
            borderBottomColor: '#630052ff',
            borderTopWidth: 3,
            borderBottomWidth: 3,
            borderLeftWidth: 0, // Hidden by extra width
            borderRightWidth: 0 // Hidden by extra width
        });
        
        // Create the text element with emote support
        this.tickerText = new RichTextElement(this.message, this.emotes, {
            fontSize: 36,
            color: '#ffffff',
            font: 'Arial',
            fontWeight: 'bold',
            textBaseline: 'middle',
            textAlign: 'left', // Left align for scrolling
            strokeColor: '#000000',
            strokeWidth: 2,
            emoteHeight: 36, // Match font size
            emotePadding: 4
        });
        
        // Position text starting off-screen to the right and vertically centered in box
        this.tickerText.x = this.W; // Start at screen width
        this.tickerText.y = this.TICKER_Y_POSITION + (this.TICKER_HEIGHT / 2); // Center vertically in box
        
        // Initially hide the text (will show during TEXT_SCROLLING state)
        this.tickerText.visible = false;
        
        // Add elements to the effect
        this.addElement(this.tickerBox);
        this.addElement(this.tickerText);
        
        // Create sound element
        this.tickerSound = new SoundElement('tickerSound');
        this.tickerSound.addBehavior(new SoundOnPlayBehavior());
        this.addElement(this.tickerSound);
    }
    
    onPlay() {
        super.onPlay();

        console.log('TickerEffect: Starting ticker effect');
        console.log('TickerEffect: Message:', this.message);
        console.log('TickerEffect: Emotes:', this.emotes);
        
        // Start with box sliding up
        this.state = TICKER_STATES.BOX_SLIDING_UP;
        this.startBoxSlideUp();
        this.isInitialized = true;
    }
    
    startBoxSlideUp() {
        console.log('TickerEffect: Starting box slide up');
        
        this.boxSlideBehavior = new TimedSlideBehavior({
            startX: this.tickerBox.x,
            startY: this.H, // Start below screen
            endX: this.tickerBox.x,
            endY: this.TICKER_Y_POSITION, // End at ticker position
            duration: this.BOX_SLIDE_DURATION
        });
        
        this.tickerBox.addBehavior(this.boxSlideBehavior);
        this.boxSlideBehavior.onPlay(this.tickerBox);
    }
    
    startTextScrolling() {
        console.log('TickerEffect: Starting text scrolling');
        
        // Calculate scroll distance: from screen width to -textWidth
        const textWidth = this.tickerText.getTextWidth();
        const scrollDistance = this.W + textWidth;
        const scrollDuration = (scrollDistance / this.TEXT_SCROLL_SPEED) * 1000; // Convert to ms
        
        console.log(`Text width: ${textWidth}, scroll distance: ${scrollDistance}, duration: ${scrollDuration}ms`);
        
        this.textScrollBehavior = new TimedSlideBehavior({
            startX: this.W, // Start at screen width
            startY: this.tickerText.y,
            endX: -textWidth, // End at negative text width
            endY: this.tickerText.y,
            duration: scrollDuration
        });
        
        this.tickerText.addBehavior(this.textScrollBehavior);
        this.textScrollBehavior.onPlay(this.tickerText);
    }

    
    startBoxSlideDown() {
        console.log('TickerEffect: Starting box slide down');
        
        // Remove the old slide behavior and create a new one for sliding down
        this.tickerBox.behaviors = [];
        
        this.boxSlideBehavior = new TimedSlideBehavior({
            startX: this.tickerBox.x,
            startY: this.TICKER_Y_POSITION, // Start at ticker position
            endX: this.tickerBox.x,
            endY: this.H, // End below screen
            duration: this.BOX_SLIDE_DURATION
        });
        
        this.tickerBox.addBehavior(this.boxSlideBehavior);
        this.boxSlideBehavior.onPlay(this.tickerBox);
    }
    
    update(deltaTime) {
        if (!this.isInitialized) return;
        
        // Update all elements first (including animated emotes)
        super.update(deltaTime);
        
        // Specifically update our ticker text for animated emotes
        // if (this.tickerText) {
        //     this.tickerText.update(deltaTime);
        // }
        
        // State machine logic - poll behaviors for completion
        switch (this.state) {
            case TICKER_STATES.BOX_SLIDING_UP:
                if (this.boxSlideBehavior && this.boxSlideBehavior.isComplete()) {
                    console.log('TickerEffect: Box slide up complete, starting text scrolling');
                    this.state = TICKER_STATES.TEXT_SCROLLING;
                    // Show the text and start scrolling
                    this.tickerText.visible = true;
                    this.startTextScrolling();
                }
                break;
                
            case TICKER_STATES.TEXT_SCROLLING:
                if (this.textScrollBehavior && this.textScrollBehavior.isComplete()) {
                    console.log('TickerEffect: Text scrolling complete, starting box slide down');
                    this.state = TICKER_STATES.BOX_SLIDING_DOWN;
                    // Hide the text
                    this.tickerText.visible = false;
                    this.startBoxSlideDown();
                }
                break;
                
            case TICKER_STATES.BOX_SLIDING_DOWN:
                if (this.boxSlideBehavior && this.boxSlideBehavior.isComplete()) {
                    console.log('TickerEffect: Box slide down complete, ticker finished');
                    this.state = TICKER_STATES.FINISHED;
                    this.onFinish();
                }
                break;
                
            case TICKER_STATES.FINISHED:
                // Do nothing, effect is complete
                break;
        }
    }
}