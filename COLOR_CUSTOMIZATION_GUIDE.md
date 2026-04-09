# 🎨 VibeTune - Color Customization Guide

Complete guide on how to change colors throughout the VibeTune application, including background colors, music player colors, and all UI elements.

---

## 📍 Where Colors Are Defined

Colors in VibeTune are defined in **two main files**:

1. **`client/global.css`** - CSS variables (HSL format)
2. **`tailwind.config.ts`** - Tailwind configuration (uses CSS variables)

**Important**: All colors use **HSL format** (Hue, Saturation, Lightness). You only need to edit `global.css` to change colors throughout the entire application.

---

## 🎯 Main Color File: `client/global.css`

All colors are defined as CSS variables in the `:root` selector. Here's what each color controls:

### Background Colors

```css
--background: 0 0% 7%;              /* Main app background */
--vibetune-dark: 0 0% 7%;            /* Dark background (same as background) */
--vibetune-darker: 0 0% 3%;          /* Darker background (sidebar, music player) */
--card: 0 0% 10%;                    /* Card backgrounds */
--sidebar-background: 0 0% 3%;       /* Sidebar background */
```

### Primary/Accent Colors (Green Theme)

```css
--primary: 142 76% 36%;              /* Primary color (green) */
--accent: 142 76% 36%;               /* Accent color (green) */
--vibetune-green: 142 76% 36%;       /* Main green color */
--vibetune-green-dark: 142 76% 28%;  /* Darker green (hover states) */
--vibetune-green-light: 142 76% 44%; /* Lighter green */
```

### Text Colors

```css
--foreground: 0 0% 98%;              /* Main text color (white) */
--vibetune-text: 0 0% 98%;           /* Main text */
--vibetune-text-muted: 0 0% 60%;    /* Muted/secondary text */
```

### Gray/Secondary Colors

```css
--vibetune-gray: 0 0% 15%;           /* Gray backgrounds */
--vibetune-light-gray: 0 0% 25%;     /* Lighter gray */
--secondary: 0 0% 15%;               /* Secondary backgrounds */
--muted: 0 0% 15%;                   /* Muted backgrounds */
```

### Border Colors

```css
--border: 0 0% 20%;                  /* Border color */
--sidebar-border: 0 0% 15%;          /* Sidebar borders */
```

---

## 🎨 How to Change Colors

### Step 1: Open `client/global.css`

Navigate to: `vibetune4/client/global.css`

### Step 2: Modify CSS Variables

Change the HSL values in the `:root` selector. The format is: `Hue Saturation% Lightness%`

**Example**: To change the primary green color to blue:

```css
/* Before */
--primary: 142 76% 36%;              /* Green */
--vibetune-green: 142 76% 36%;

/* After */
--primary: 210 76% 36%;              /* Blue */
--vibetune-green: 210 76% 36%;       /* Change this too */
```

### Step 3: Save and Restart

After making changes:
1. Save the file
2. Restart the dev server (`npm run dev`)
3. Colors will update automatically

---

## 🎵 Music Player Color Customization

The music player uses these specific colors:

### Music Player Background
```css
/* In global.css */
--vibetune-darker: 0 0% 3%;          /* Music player background */
```

**To change music player background:**
```css
--vibetune-darker: 0 0% 5%;           /* Lighter */
--vibetune-darker: 220 30% 10%;      /* Blue tint */
--vibetune-darker: 0 0% 0%;          /* Pure black */
```

### Music Player Border
```css
--vibetune-gray: 0 0% 15%;           /* Top border of music player */
```

### Music Player Active Colors
```css
--vibetune-green: 142 76% 36%;       /* Active buttons (shuffle, repeat, like) */
```

**To change active button color:**
```css
--vibetune-green: 210 76% 36%;        /* Blue */
--vibetune-green: 0 76% 50%;         /* Red */
--vibetune-green: 280 76% 36%;       /* Purple */
```

### Music Player Text
```css
--vibetune-text: 0 0% 98%;           /* Track title */
--vibetune-text-muted: 0 0% 60%;     /* Artist name, time */
```

---

## 🎨 Complete Color Change Examples

### Example 1: Change to Blue Theme

Replace green with blue throughout the app:

```css
:root {
  /* Change primary green to blue */
  --primary: 210 76% 36%;              /* Blue instead of green */
  --accent: 210 76% 36%;
  --vibetune-green: 210 76% 36%;       /* Still called 'green' but now blue */
  --vibetune-green-dark: 210 76% 28%;
  --vibetune-green-light: 210 76% 44%;
  --ring: 210 76% 36%;
  --sidebar-primary: 210 76% 36%;
  --sidebar-ring: 210 76% 36%;
}
```

### Example 2: Change to Purple Theme

```css
:root {
  --primary: 280 76% 36%;              /* Purple */
  --accent: 280 76% 36%;
  --vibetune-green: 280 76% 36%;      /* Purple (keeping variable name) */
  --vibetune-green-dark: 280 76% 28%;
  --vibetune-green-light: 280 76% 44%;
  --ring: 280 76% 36%;
  --sidebar-primary: 280 76% 36%;
  --sidebar-ring: 280 76% 36%;
}
```

### Example 3: Change Background to Lighter Gray

```css
:root {
  --background: 0 0% 12%;              /* Lighter gray (was 7%) */
  --vibetune-dark: 0 0% 12%;          /* Match background */
  --vibetune-darker: 0 0% 8%;          /* Slightly darker for sidebar/player */
  --card: 0 0% 15%;                    /* Lighter cards */
  --sidebar-background: 0 0% 8%;
}
```

### Example 4: Change to Dark Blue Theme

```css
:root {
  /* Backgrounds - Blue tint */
  --background: 220 20% 8%;            /* Dark blue-gray */
  --vibetune-dark: 220 20% 8%;
  --vibetune-darker: 220 20% 5%;
  --card: 220 20% 12%;
  --sidebar-background: 220 20% 5%;
  
  /* Primary color - Cyan/Blue */
  --primary: 195 76% 40%;              /* Cyan */
  --accent: 195 76% 40%;
  --vibetune-green: 195 76% 40%;      /* Cyan accent */
  --vibetune-green-dark: 195 76% 32%;
  --vibetune-green-light: 195 76% 48%;
}
```

---

## 🎯 Specific Component Colors

### Sidebar Colors

```css
--sidebar-background: 0 0% 3%;         /* Sidebar background */
--sidebar-foreground: 0 0% 90%;        /* Sidebar text */
--sidebar-primary: 142 76% 36%;       /* Active sidebar item */
--sidebar-accent: 0 0% 15%;            /* Hover background */
--sidebar-border: 0 0% 15%;            /* Sidebar borders */
```

### Card Colors

```css
--card: 0 0% 10%;                      /* Card background */
--card-foreground: 0 0% 95%;          /* Card text */
```

### Input/Form Colors

```css
--input: 0 0% 15%;                     /* Input background */
--border: 0 0% 20%;                    /* Input borders */
```

---

## 🌈 HSL Color Reference

### Understanding HSL Format

- **Hue (H)**: 0-360 (color wheel)
  - 0 = Red
  - 120 = Green
  - 180 = Cyan
  - 240 = Blue
  - 300 = Magenta

- **Saturation (S)**: 0-100% (intensity)
  - 0% = Gray
  - 100% = Full color

- **Lightness (L)**: 0-100% (brightness)
  - 0% = Black
  - 50% = Normal
  - 100% = White

### Common Color Values

```css
/* Red */
--color: 0 76% 50%;

/* Orange */
--color: 30 76% 50%;

/* Yellow */
--color: 60 76% 50%;

/* Green */
--color: 142 76% 36%;

/* Cyan */
--color: 180 76% 40%;

/* Blue */
--color: 210 76% 36%;

/* Purple */
--color: 280 76% 36%;

/* Pink */
--color: 330 76% 50%;
```

---

## 🎵 Music Player Specific Changes

### Change Music Player Background Only

In `client/components/MusicPlayer.tsx`, the player uses:
- `bg-vibetune-darker` - Background
- `border-vibetune-gray` - Top border

**To change only music player:**
1. Edit `global.css`:
```css
--vibetune-darker: 220 30% 10%;      /* Blue-tinted background */
```

### Change Music Player Active Button Color

Active buttons (shuffle, repeat, like) use `text-vibetune-green`:

**To change:**
```css
--vibetune-green: 210 76% 50%;        /* Brighter blue */
```

### Change Play Button Color

The play button uses hardcoded white/black. To change it, edit `MusicPlayer.tsx`:

```tsx
// Line 111 - Change this:
className="w-8 h-8 p-0 bg-white hover:bg-gray-200 text-black rounded-full"

// To this (using theme color):
className="w-8 h-8 p-0 bg-vibetune-green hover:bg-vibetune-green-dark text-white rounded-full"
```

---

## 🎨 Quick Color Schemes

### Dark Theme (Current)
```css
--background: 0 0% 7%;
--vibetune-green: 142 76% 36%;
```

### Light Theme
```css
--background: 0 0% 95%;
--foreground: 0 0% 10%;
--vibetune-green: 142 76% 40%;
--vibetune-dark: 0 0% 98%;
--vibetune-darker: 0 0% 95%;
```

### Spotify Green Theme
```css
--vibetune-green: 142 71% 45%;        /* Spotify's exact green */
```

### Apple Music Red Theme
```css
--vibetune-green: 0 76% 50%;          /* Red accent */
```

### YouTube Red Theme
```css
--vibetune-green: 0 84% 60%;          /* YouTube red */
```

---

## 📝 Step-by-Step: Change All Colors

### Complete Color Change Process

1. **Open** `vibetune4/client/global.css`

2. **Find** the `:root` selector (around line 11)

3. **Change** these key variables:
   ```css
   --background: [YOUR COLOR];
   --vibetune-dark: [YOUR COLOR];
   --vibetune-darker: [YOUR COLOR];
   --primary: [YOUR COLOR];
   --vibetune-green: [YOUR COLOR];
   ```

4. **Update** all related colors:
   - `--accent` (should match `--primary`)
   - `--ring` (should match `--primary`)
   - `--sidebar-primary` (should match `--primary`)
   - `--vibetune-green-dark` (darker version)
   - `--vibetune-green-light` (lighter version)

5. **Save** the file

6. **Restart** dev server:
   ```bash
   npm run dev
   ```

7. **Check** your changes in the browser

---

## 🎯 Where Each Color is Used

### `--vibetune-dark` (Background)
- Main app background
- Page backgrounds
- Loading screens

### `--vibetune-darker` (Darker Background)
- Sidebar background
- Music player background
- Darker sections

### `--vibetune-green` (Primary/Accent)
- Active buttons
- Hover states
- Links
- Icons
- Progress bars
- Active menu items

### `--vibetune-gray` (Secondary)
- Card backgrounds
- Input backgrounds
- Borders
- Hover states

### `--vibetune-text` (Text)
- Main text
- Headings
- Primary content

### `--vibetune-text-muted` (Muted Text)
- Secondary text
- Artist names
- Timestamps
- Descriptions

---

## 🔧 Advanced: Custom Color Variables

You can add your own color variables:

### Step 1: Add to `global.css`
```css
:root {
  /* Your custom colors */
  --my-custom-color: 210 76% 50%;
  --my-custom-dark: 210 76% 40%;
}
```

### Step 2: Add to `tailwind.config.ts`
```typescript
colors: {
  vibetune: {
    // ... existing colors
    "my-custom": "hsl(var(--my-custom-color))",
    "my-custom-dark": "hsl(var(--my-custom-dark))",
  }
}
```

### Step 3: Use in Components
```tsx
<div className="bg-vibetune-my-custom text-white">
  Custom colored element
</div>
```

---

## 🎨 Color Testing Tool

Use this online tool to find HSL values:
- **HSL Color Picker**: https://hslpicker.com/
- **Coolors**: https://coolors.co/

### How to Use:
1. Pick a color you like
2. Convert to HSL format
3. Use the values in `global.css`

**Example:**
- RGB: `rgb(34, 197, 94)` (Spotify green)
- HSL: `142 71% 45%`
- Use: `--vibetune-green: 142 71% 45%;`

---

## ✅ Checklist: Changing Colors

- [ ] Open `client/global.css`
- [ ] Find `:root` selector
- [ ] Change `--background` for main background
- [ ] Change `--vibetune-darker` for sidebar/player
- [ ] Change `--vibetune-green` for accent color
- [ ] Update related colors (`--primary`, `--accent`, `--ring`)
- [ ] Update sidebar colors if needed
- [ ] Save file
- [ ] Restart dev server
- [ ] Test in browser

---

## 🚨 Important Notes

1. **HSL Format**: All colors must be in HSL format: `H S% L%`
2. **No `hsl()` wrapper**: Don't write `hsl(142 76% 36%)`, just `142 76% 36%`
3. **Both selectors**: Update both `:root` and `.dark` if you want consistent colors
4. **Restart required**: Changes require dev server restart
5. **Variable names**: Keep variable names the same, only change values

---

## 🎯 Quick Reference: File Locations

- **Main color file**: `vibetune4/client/global.css`
- **Tailwind config**: `vibetune4/tailwind.config.ts`
- **Music player**: `vibetune4/client/components/MusicPlayer.tsx`
- **Sidebar**: `vibetune4/client/components/Sidebar.tsx`

---

## 💡 Pro Tips

1. **Use a color palette generator** to create harmonious color schemes
2. **Test contrast** - ensure text is readable on backgrounds
3. **Keep it consistent** - change all related colors together
4. **Document your changes** - note what colors you changed and why
5. **Test on different screens** - colors may look different on various displays

---

## 🎨 Example: Complete Theme Change

Here's a complete example changing from green to blue theme:

```css
:root {
  /* Backgrounds - Keep dark */
  --background: 0 0% 7%;
  --vibetune-dark: 0 0% 7%;
  --vibetune-darker: 0 0% 3%;
  
  /* Change green to blue */
  --primary: 210 76% 36%;              /* Blue */
  --accent: 210 76% 36%;                /* Blue */
  --vibetune-green: 210 76% 36%;       /* Blue (variable name stays) */
  --vibetune-green-dark: 210 76% 28%;  /* Darker blue */
  --vibetune-green-light: 210 76% 44%; /* Lighter blue */
  --ring: 210 76% 36%;                 /* Blue focus ring */
  
  /* Sidebar - Blue accent */
  --sidebar-primary: 210 76% 36%;
  --sidebar-ring: 210 76% 36%;
  
  /* Text - Keep white */
  --foreground: 0 0% 98%;
  --vibetune-text: 0 0% 98%;
}
```

---

**That's it!** You now know how to change any color in the VibeTune application. Just edit `global.css` and restart your dev server! 🎨

