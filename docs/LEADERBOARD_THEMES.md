# Leaderboard Theme Management System

## Overview
This system allows admins to upload and manage custom backgrounds and frame overlays for the leaderboard, including support for both image and video formats.

## Features

### 🎨 Background Management
- Upload custom background **image** or **video** URL
- Supported formats: JPG, PNG, GIF (images) / MP4, WebM (videos)
- Background appears behind the entire leaderboard

### 👑 Rank Frame Overlays
Create custom overlays for each rank:
- **Rank 1 (Gold)**: Custom video/image frame for 1st place
- **Rank 2 (Silver)**: Custom video/image frame for 2nd place  
- **Rank 3 (Bronze)**: Custom video/image frame for 3rd place
- **Top Players**: Frame for 4th+ ranked players

Each frame can be:
- **Image**: PNG/JPG with transparency recommended
- **Video**: MP4/WebM for animated frames

### 🌐 Multi-Theme Support
- Create multiple themes
- Switch between themes instantly
- Only one theme active at a time
- Keep theme history for easy switching

---

## File Structure

```
src/
├── types/
│   └── leaderboard-theme.ts          # TypeScript types
├── components/admin/
│   └── leaderboard-theme-admin.tsx   # Admin panel component
├── app/
│   ├── leaderboard/
│   │   └── page.tsx                  # Updated with theme support
│   └── admin/leaderboard-themes/
│       └── page.tsx                  # Admin route
└── firestore.rules                   # Security rules
```

---

## Database Schema

### Collection: `leaderboardThemes`

```javascript
{
  id: string,                          // Document ID
  name: string,                        // Theme name (e.g., "Golden Royal")
  backgroundUrl: string,               // Background image/video URL
  backgroundType: "image" | "video",   // Type of background
  isActive: boolean,                   // Currently active theme
  frameConfigs: {
    rank1: {
      videoUrl: string,                // Video URL for rank 1 frame
      imageUrl: string,                // Image URL for rank 1 frame
      type: "video" | "image",         // Current type
      isEnabled: boolean               // Whether frame is enabled
    },
    rank2: { /* same structure */ },
    rank3: { /* same structure */ },
    top: { /* same structure */ }      // For rank 4+ players
  },
  createdAt: number,                   // Timestamp
  updatedAt: number,                   // Timestamp
  createdBy: string                    // Admin user ID
}
```

---

## Admin Panel Usage

### Access Admin Panel
Navigate to: `/admin/leaderboard-themes`

### Create New Theme
1. Click "Create New Theme" section
2. Enter theme name (e.g., "Golden Royal")
3. Add background URL (image or video)
4. For each rank (1, 2, 3, Top):
   - Choose Image or Video
   - Paste the URL
   - System shows preview for images
5. Click "Create Theme"

### Edit Theme
1. Find theme in "All Themes" list
2. Click "Edit" button
3. Modify any fields
4. Click "Update Theme"

### Activate Theme
1. Find theme in list
2. Click "Activate" button
3. Theme will be live immediately on leaderboard

### Delete Theme
1. Find theme in list
2. Click "Delete" button
3. Confirm deletion

---

## Asset Guidelines

### Background Best Practices
- **Image**: 1920x1080 @ 72dpi, < 2MB
- **Video**: 1920x1080, MP4, H.264, < 10MB, looped
- Use dark/semi-transparent backgrounds for text readability
- Aspect ratio: 16:9

### Frame Overlay Best Practices
- **Image**: 500x500px, PNG with transparency, < 500KB
- **Video**: 500x500px, MP4, < 2MB, looped
- Use PNG with transparency for better integration
- Overlays appear on avatar borders

### URL Hosting Options
- AWS S3
- Google Cloud Storage
- Firebase Storage
- Cloudinary
- Any CDN with direct URL access

---

## Code Integration

### Leaderboard Page Updates
The leaderboard page (`src/app/leaderboard/page.tsx`) automatically:
1. Fetches active theme on mount
2. Applies background styling
3. Renders frame overlays on rank avatars
4. Falls back to default theme if none active

### Key Components Modified
- `ThemeBackground`: Renders dynamic background
- `FrameOverlay`: Applies frame overlays to avatars
- `CircleAvatar`: Updated to support frame props
- `RankingList`: Passes theme data to components

---

## Security

### Firestore Rules
```javascript
match /leaderboardThemes/{document=**} {
  // Public read for active themes
  allow read: if resource.data.isActive == true;
  
  // Admin-only write
  allow create, update, delete: if request.auth.token.admin == true;
}
```

### Admin Requirements
- Users must have `admin: true` in custom claims
- Set via Firebase Console or Admin SDK

---

## Example Theme Creation

### "Neon Cyberpunk"
```json
{
  "name": "Neon Cyberpunk",
  "backgroundUrl": "https://cdn.example.com/neon-bg.mp4",
  "backgroundType": "video",
  "frameConfigs": {
    "rank1": {
      "videoUrl": "https://cdn.example.com/rank1-neon.mp4",
      "type": "video"
    },
    "rank2": {
      "imageUrl": "https://cdn.example.com/rank2-neon.png",
      "type": "image"
    }
  }
}
```

---

## Troubleshooting

### Backgrounds Not Loading
- Check URL accessibility (CORS enabled)
- Verify URL format (should be direct link)
- Check file size limits
- Test URL in browser

### Frames Not Appearing
- Ensure `isEnabled: true` in database
- Check URL accessibility
- Verify file format (PNG recommended for images)
- Test transparency in PNG files

### Theme Not Activating
- Check admin permissions
- Verify Firestore rules
- Clear browser cache
- Check console for errors

### Performance Issues
- Reduce video file sizes
- Use CDN for faster delivery
- Optimize image sizes
- Limit number of active themes

---

## API Reference

### Fetch Active Theme
```typescript
const q = query(
  collection(firestore, 'leaderboardThemes'),
  where('isActive', '==', true),
  limit(1)
);
```

### Get All Themes
```typescript
const q = query(
  collection(firestore, 'leaderboardThemes'),
  orderBy('updatedAt', 'desc')
);
```

### Update Theme
```typescript
await updateDoc(doc(firestore, 'leaderboardThemes', themeId), {
  isActive: true,
  updatedAt: Date.now()
});
```

---

## Future Enhancements

- [ ] Theme preview before activation
- [ ] Template library of pre-made themes
- [ ] Scheduled theme changes
- [ ] A/B testing for themes
- [ ] User voting for favorite themes
- [ ] Theme performance analytics
