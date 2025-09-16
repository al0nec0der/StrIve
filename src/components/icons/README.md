# Lucide Icons Integration

This project now uses [Lucide Icons](https://lucide.dev/) through the `lucide-react` package for consistent, beautiful icons throughout the application.

## Installation

The Lucide React package has been added to the project dependencies:

```bash
npm install lucide-react
```

## Usage

### Basic Import and Usage

Import specific icons directly in your components:

```jsx
import { Search, Heart, User, Play, Pause } from './icons';

const MyComponent = () => {
  return (
    <div>
      <Search className="w-6 h-6 text-white" />
      <Heart className="w-6 h-6 text-red-500" />
      <User className="w-6 h-6 text-gray-300" />
    </div>
  );
};
```

### Available Icons

Visit [Lucide.dev](https://licude.dev/icons/) to browse all available icons. Search for icons and import them by their exact name.

### Commonly Used Icons in This Project

Here are some icons that are already being used in the project:

| Icon Name | Usage | Example |
|-----------|-------|---------|
| `Search` | Header search button | `<Search className="w-6 h-6" />` |
| `Star` | Rating display | `<Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />` |
| `Maximize` | Fullscreen button | `<Maximize className="w-5 h-5" />` |
| `RotateCw` | Retry/next server button | `<RotateCw className="w-5 h-5" />` |
| `X` | Close button | `<X className="w-5 h-5" />` |
| `Lock` | Login required screens | `<Lock className="w-16 h-16" />` |
| `Play` | Play buttons | `<Play className="w-6 h-6" />` |
| `Plus` | Add to list buttons | `<Plus className="w-6 h-6" />` |
| `ArrowLeft` | Back navigation | `<ArrowLeft className="w-6 h-6" />` |
| `Flame` | Popular content | `<Flame className="w-6 h-6 text-orange-500" />` |
| `Calendar` | Upcoming content | `<Calendar className="w-6 h-6 text-blue-400" />` |
| `Tv` | TV shows | `<Tv className="w-6 h-6 text-green-500" />` |
| `Radio` | Live/on-air content | `<Radio className="w-6 h-6 text-red-500" />` |

### Styling Icons

All Lucide icons accept standard SVG props and can be styled with Tailwind CSS classes:

```jsx
<Search 
  className="w-6 h-6 text-white hover:text-red-500" 
  strokeWidth={1.5}
/>
```

You can also use other SVG props:
- `color`: To set the stroke color
- `size`: To set both width and height
- `strokeWidth`: To adjust the stroke width

### Filled Icons

Some icons like stars for ratings look better when filled. You can achieve this with the `fill` prop:

```jsx
<Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
```

## Implementation Examples

### Header Component
The Header component now uses the `Search` icon instead of inline SVG:

```jsx
import { Search } from "../components/icons";

// In the component:
<button aria-label="Search" className="text-white hover:text-red-500">
  <Search className="w-6 h-6" />
</button>
```

### Media Players
Both MoviePlayer and TVShowPlayer components use several icons:

```jsx
import { Star, Maximize, RotateCw, X, Lock } from "../components/icons";

// In the component:
<button onClick={handleTryNextServer}>
  <RotateCw className="w-5 h-5" />
</button>

<button onClick={handleFullScreen}>
  <Maximize className="w-5 h-5" />
</button>

<button onClick={onClose}>
  <X className="w-5 h-5" />
</button>

// For login required screens:
<Lock className="w-16 h-16 mx-auto" />
```

### Movie and TV Show Cards
Cards now use professional icons instead of emojis:

```jsx
import { Star, Play } from "../components/icons";

// Rating display:
<div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center">
  <Star className="w-3 h-3 mr-1 text-yellow-400 fill-yellow-400" />
  {rating}
</div>

// Play button overlay:
<Play className="w-6 h-6 text-black" />
```

## Benefits of Using Lucide Icons

1. **Consistent Design**: All icons follow the same design language
2. **Customizable**: Easy to change size, color, and stroke width
3. **Lightweight**: Optimized SVG icons with minimal overhead
4. **Accessible**: Properly structured for screen readers
5. **Tree Shakable**: Only imported icons are included in the bundle
6. **Professional Look**: Replaces emojis with scalable vector graphics

## Best Practices

1. **Import Only What You Need**: Import specific icons rather than the entire library
2. **Use Semantic Names**: Choose icons that clearly represent their function
3. **Maintain Consistency**: Use the same icons for similar functions across the app
4. **Provide Accessibility Labels**: Use `aria-label` for icon-only buttons
5. **Size Appropriately**: Use consistent sizes (e.g., `w-5 h-5` or `w-6 h-6`) throughout the app
6. **Use Filled Variants**: For icons like stars in ratings, use `fill-current` or specific fill colors

## Updating Icons

To update to the latest version of Lucide React:

```bash
npm update lucide-react
```

## Adding New Icons

1. Find the icon you need at [Lucide.dev](https://lucide.dev/icons/)
2. Import it in your component:
   ```jsx
   import { NewIcon } from '../components/icons';
   ```
3. Use it in your JSX:
   ```jsx
   <NewIcon className="w-6 h-6" />
   ```

## Troubleshooting

If icons aren't displaying:
1. Check that you've imported the icon correctly
2. Verify the import path is correct
3. Ensure the icon name matches exactly (case-sensitive)
4. Check that the `lucide-react` package is installed

If you need to add more icons, simply import them from the icons directory:
```jsx
import { NewIcon } from '../components/icons';
```