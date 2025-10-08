<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Gel Chopper Overlay

A web-based tool for analyzing gel electrophoresis images with customizable grid overlays. Upload gel images, position multiple grids, and annotate lanes for precise analysis and documentation.

**Live Demo:** [https://miguel-bonnin.github.io/Gel_Chopper_Overlay/](https://miguel-bonnin.github.io/Gel_Chopper_Overlay/)

## Features

- **Multi-Grid Support**: Create and manage multiple independent grids on a single image
- **Customizable Grids**: Adjust rows, columns, size, position, colors, and opacity
- **Flexible Gaps**: Add custom gaps between lanes or rows
- **Annotation System**: Label lanes with automatic numbering or custom text
- **Pass/Fail Marking**: Mark individual lanes with visual indicators
- **Export Options**:
  - PNG export with overlays burned in
  - CSV export of grid configurations and annotations
- **Drag & Resize**: Intuitive controls for positioning and sizing grids
- **Real-time Preview**: See changes instantly as you adjust settings

## Quick Start

### Option 1: Use Online (No Installation)

Visit [https://miguel-bonnin.github.io/Gel_Chopper_Overlay/](https://miguel-bonnin.github.io/Gel_Chopper_Overlay/) and start using immediately!

### Option 2: Run Locally

**Prerequisites:** Node.js (v18 or later)

1. Clone the repository:
   ```bash
   git clone https://github.com/Miguel-Bonnin/Gel_Chopper_Overlay.git
   cd Gel_Chopper_Overlay
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage Guide

1. **Upload Image**: Click "Upload Image" and select your gel electrophoresis image
2. **Position Grid**: Drag the grid to align with your gel lanes
3. **Adjust Dimensions**:
   - Resize using corner handles
   - Set precise rows/columns in the control panel
4. **Customize Appearance**:
   - Change line color, thickness, and opacity
   - Toggle annotations and customize their style
5. **Add Multiple Grids**: Use "Add New Grid" to analyze different sections
6. **Add Gaps**: Right-click between lanes to insert custom spacing
7. **Annotate**: Add custom labels or mark lanes as pass/fail
8. **Export**: Save your annotated image as PNG or export data as CSV

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **GitHub Actions** - Automated deployment
- **GitHub Pages** - Hosting

## Development

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## Deployment

This project automatically deploys to GitHub Pages on every push to `main` via GitHub Actions. The workflow:

1. Installs dependencies
2. Builds the React app
3. Deploys to GitHub Pages

See [.github/workflows/deploy.yml](.github/workflows/deploy.yml) for details.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - feel free to use this project for any purpose.

## Original Source

Based on an AI Studio app: https://ai.studio/apps/drive/1BW1sRNa9IsvZD-Xn5jChxjdZSkKEdqrN
