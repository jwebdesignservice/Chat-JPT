# Research Archive Interface

A modern conversational research interface with an investigative, documentary tone. Designed for exploring verified records, documented events, and official testimonies.

## Features

- **Three-Panel Layout**: Navigation sidebar, main chat area, and context drawer
- **Professional Design**: Deep archival blue color palette with clean typography
- **Evidence Classification**: Visual tags for different source types (Confirmed, Testimony, Allegation, Media)
- **Structured Responses**: AI responses follow a consistent four-part structure
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

```
CHAT JPT/
├── index.html              # Main HTML file
├── css/
│   ├── variables.css       # Design tokens (colors, typography, spacing)
│   ├── base.css            # Reset and base styles
│   ├── layout.css          # Three-panel layout structure
│   ├── components.css      # Reusable UI components
│   └── chat.css            # Chat-specific styles
├── js/
│   └── app.js              # Application JavaScript
├── data/
│   ├── timeline-data.json  # Middle East/Israel-Palestine events (1990-2012)
│   └── epstein-data.json   # Epstein case documentation
├── config/
│   └── system-prompt.md    # AI personality configuration
└── README.md
```

## Design System

### Colors

| Role | Hex | Usage |
|------|-----|-------|
| Primary | `#1E3A5F` | Headers, primary actions |
| Background | `#F7F9FC` | Main canvas |
| Accent | `#5C7A99` | Buttons, interactive elements |
| Panel | `#E8ECF0` | Cards, structural elements |
| AI Message | `#F0F4F8` | AI response backgrounds |

### Typography

- **Headings**: Inter (geometric sans-serif)
- **Body**: Inter (readable sans-serif)
- **Citations**: JetBrains Mono (monospace)

## Usage

1. Open `index.html` in a web browser
2. Type a question in the input field
3. Press Enter or click the send button
4. View AI responses with structured evidence classification

## AI Personality

The AI assistant presents as a combination of:
- Investigative journalist
- Legal researcher
- Documentary narrator

### Response Structure

1. **Direct Answer**: Clear, neutral 1-2 sentence summary
2. **Context**: Background information and timeline
3. **Evidence Framing**: Classification of information sources
4. **Closing**: Optional next steps for further research

### Evidence Types

- **Confirmed Fact**: Official records, court filings
- **Testimony**: Sworn statements, depositions
- **Allegation**: Unproven claims in legal filings
- **Media Report**: Journalism, not independently verified

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Archive Data

The interface includes two comprehensive data files that enable intelligent responses to user queries:

### Timeline Data (`data/timeline-data.json`)

Covers 1990-2012 Middle East and Israeli-Palestinian events:

- **Oslo Peace Process**: Secret negotiations, 1993 accords, Oslo II (1995)
- **Gulf War**: Saddam Hussein's Scud attacks on Israel (1991)
- **Military Operations**: Grapes of Wrath (1996), Lebanon War (2006), Operation Orchard (2007), Cast Lead (2008-09), Pillar of Defense (2012)
- **Peace Negotiations**: Sharm el-Sheikh (1999), Camp David (2000), Taba (2001), Annapolis (2007)
- **Gaza Disengagement**: 2005 withdrawal under Sharon
- **Diplomatic Events**: Israel-Turkey crisis (2010-2011)

Includes profiles on key figures: Saddam Hussein, Uri Savir, Yasser Arafat, Ehud Barak, Yitzhak Rabin, Ariel Sharon, Ehud Olmert, Mahmoud Abbas.

### Epstein Data (`data/epstein-data.json`)

Comprehensive documentation of the Epstein case:

- **Case Overview**: Charges, death, key accomplice (Ghislaine Maxwell)
- **Document Releases**: January 2024 unsealing, Transparency Act releases
- **Legal Timeline**: 2008 plea deal, 2019 indictment, Maxwell conviction
- **Key Locations**: Little St. James Island, Manhattan townhouse, Palm Beach estate, Zorro Ranch
- **Network Information**: Categories of individuals mentioned in documents (with appropriate disclaimers)

### Sample Queries

Users can ask questions like:
- "What happened at the Oslo Accords?"
- "Tell me about Epstein documents released in 2024"
- "What was the 2005 Gaza disengagement?"
- "Who was Ehud Barak?"
- "What happened to Ghislaine Maxwell?"
- "Tell me about the Mavi Marmara incident"

## Development

This is a static HTML/CSS/JS project. No build tools required.

To modify the design:
1. Edit CSS variables in `css/variables.css`
2. Component styles are in `css/components.css`
3. Chat-specific styles are in `css/chat.css`

To modify AI behavior:
1. Update `AI_PERSONALITY` object in `js/app.js`
2. Reference `config/system-prompt.md` for guidelines

To add/update archive data:
1. Edit JSON files in `data/` directory
2. Follow existing data structure for consistency
3. Data is automatically loaded when the app initializes

## License

This project is for demonstration purposes.
