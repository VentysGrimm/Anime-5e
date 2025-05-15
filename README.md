# Anime 5E System for Foundry VTT

A system for playing Anime 5E in Foundry VTT.

## Directory Structure

```
anime5e/
├── assets/           # Static assets like images and sounds
│   ├── icons/       # System icons
│   └── images/      # System images
├── lang/            # Localization files
│   └── en.json     # English localization
├── module/          # System JavaScript modules
│   ├── actor/      # Actor-related modules
│   ├── apps/       # Application windows
│   ├── combat/     # Combat-related modules
│   ├── config/     # System configuration
│   ├── data/       # Data model definitions
│   ├── documents/  # Document class definitions
│   ├── helpers/    # Helper functions and utilities
│   ├── item/       # Item-related modules
│   └── sheets/     # Actor and Item sheet classes
├── packs/          # Compendium packs
├── styles/         # CSS stylesheets
│   ├── anime5e.css # Main stylesheet
│   └── sheets/     # Sheet-specific styles
├── templates/      # Handlebars templates
│   ├── actor/      # Actor sheet templates
│   ├── apps/       # Application templates
│   └── item/       # Item sheet templates
├── system.json     # System manifest
└── README.md       # This file
```

## Features

- Custom character sheet designed for Anime 5E
- Support for unique Anime 5E classes and abilities
- Special power system with MP tracking
- Integrated item compendiums for weapons, armor, and magical items
- Custom styling with anime-inspired theme

## Installation

1. In Foundry VTT's Configuration and Setup screen, go to Game Systems
2. Click "Install System"
3. In the Manifest URL field paste: (https://github.com/VentysGrimm/Anime-5e)

## Development

### Prerequisites

- Node.js 16+
- Foundry VTT

### Setup

1. Clone this repository
2. Run `npm install`
3. Create a link to your Foundry systems directory:
   ```bash
   ln -s /path/to/repo /path/to/foundry/systems/anime5e
   ```

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

## Manual Installation

1. Download the latest release from the releases page
2. Extract the zip file
3. Place the extracted folder in your Foundry VTT's `systems` directory
4. Restart Foundry VTT if it was running

## Usage

1. Create a new world in Foundry VTT
2. Select "Anime 5E" as the game system
3. Launch the world
4. Create characters using the custom character sheet
5. Add items, powers, and abilities from the compendiums

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Your License]

## Support

For support, please:
1. Check the [Wiki](link-to-wiki)
2. Open an issue on the [Issue Tracker](link-to-issues)
3. Join our [Discord Community](link-to-discord)

## Credits

- System Creator: [Your Name]
- Contributors: [List of contributors]
- Special thanks to the Foundry VTT community 
