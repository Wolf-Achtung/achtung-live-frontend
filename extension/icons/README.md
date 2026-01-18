# achtung.live Extension Icons

## Required Icons

The extension requires icons in the following sizes:
- `icon-16.png` - 16x16 pixels (toolbar)
- `icon-48.png` - 48x48 pixels (extension management)
- `icon-128.png` - 128x128 pixels (Chrome Web Store)

## Creating the Icons

### Option 1: Use the SVG Template

Create icons from `icon.svg` using any image editor or online converter:

1. Open `icon.svg` in an image editor (Inkscape, Figma, etc.)
2. Export as PNG in the required sizes
3. Save to this folder with the correct names

### Option 2: Online Generator

1. Go to https://realfavicongenerator.net/
2. Upload your logo image
3. Download the generated favicon package
4. Copy the relevant sizes to this folder

### Option 3: Command Line (ImageMagick)

```bash
# If you have ImageMagick installed:
convert icon.svg -resize 16x16 icon-16.png
convert icon.svg -resize 48x48 icon-48.png
convert icon.svg -resize 128x128 icon-128.png
```

## Icon Design Guidelines

The achtung.live icon should:
- Use the brand color: #800000 (dark red)
- Be simple and recognizable at small sizes
- Include the [a] or shield motif
- Have a transparent background
