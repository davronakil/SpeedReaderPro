# SpeedReader Pro 🚀

A modern, responsive web application for speed reading that helps you read faster by focusing on one word at a time with an optimal focal point.

**🔗 [Try it live](https://akil.me/reader)**

## Features

- ⚡ **One word at a time** - Eliminates distractions and helps maintain focus
- 🔴 **Optimal focal point** - Red letter highlighting based on Optimal Recognition Point (ORP) research
- 📱 **Mobile-first design** - Fully responsive and optimized for all devices
- ⚙️ **Customizable speed** - Adjust reading speed from 50 to 1000 words per minute
- 🔤 **Font size control** - Adjust font size from 24px to 120px
- 💾 **Progress saving** - Save your reading progress and resume later
- ⏸️ **Pause/Resume** - Click anywhere on the word or press spacebar to pause
- 📄 **Paragraph detection** - Automatic pauses between paragraphs for natural reading flow
- 🎨 **Beautiful UI** - Modern gradient design with smooth animations

## How It Works

SpeedReader Pro uses the Optimal Recognition Point (ORP) technique, which positions a highlighted focal letter at the optimal position within each word. This allows your eyes to focus on a single point while your brain processes the entire word, resulting in faster reading without losing comprehension.

### Optimal Recognition Point Algorithm

The app calculates the best focal point based on word length:
- **1 character** → index 0
- **2-5 characters** → index 1
- **6-9 characters** → index 2
- **10-13 characters** → index 3
- **14+ characters** → index 4

The red focal letter stays perfectly centered on screen, creating a stable reading experience.

## Usage

1. **Paste your text** - Enter or paste any text up to 1,000,000 characters
2. **Click "Start Reading"** - Begin your speed reading session
3. **Adjust settings** - Use the sliders to find your optimal speed and font size
4. **Focus on the red letter** - Keep your eyes on the centered red focal point
5. **Pause anytime** - Click the word or press spacebar to pause/resume
6. **Save progress** - Save your position to resume later

## Keyboard Shortcuts

- `Space` - Pause/Resume reading
- `Escape` - Return to input screen
- `Ctrl + Enter` - Start reading from input screen

## Technical Details

- **Pure HTML/CSS/JavaScript** - No frameworks or dependencies
- **LocalStorage** - Progress is saved locally in your browser
- **Responsive design** - Works seamlessly on desktop, tablet, and mobile
- **Mobile-first** - Optimized for touch interactions

## Browser Support

Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Installation

No installation required! Just open `index.html` in your browser, or:

1. Clone the repository:
```bash
git clone https://github.com/davronakil/SpeedReaderPro.git
```

2. Open `index.html` in your web browser

That's it! No build process, no dependencies, just pure web technologies.

## Project Structure

```
SpeedReaderPro/
├── index.html      # Main HTML structure
├── styles.css      # All styling and responsive design
├── app.js          # Core functionality and logic
└── README.md       # This file
```

## Development

This project was built with:
- Pure vanilla JavaScript (ES6+)
- Modern CSS (CSS Variables, Flexbox, Grid)
- HTML5 semantic elements

## License

This project is open source and available for personal and commercial use.

## Credits

Built with ❤️ using the Optimal Recognition Point (ORP) technique inspired by Spritz-style speed reading research.

---

**Made in 5 minutes with good vibes** ⚡

For questions or feedback, visit the [demo](https://akil.me/reader) or open an issue on GitHub.
