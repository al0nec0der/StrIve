# Firestore Schema Documentation

## Collections Structure

### Custom Lists

The custom lists feature uses a hierarchical structure within the `users` collection.

#### users/{userId}/custom_lists/{listId}

**Document Fields:**
- `name` (string) - The name of the custom list
- `createdAt` (timestamp) - When the list was created
- `ownerId` (string) - The ID of the user who owns this list (should match the userId in the path)

#### users/{userId}/custom_lists/{listId}/items/{mediaId}

**Document Fields:**
- `id` (number) - The unique identifier for the media item
- `title` (string) - The title of the media item
- `poster_path` (string) - Path to the poster image
- `media_type` (string) - Type of media ('movie' or 'tv')
- `dateAdded` (timestamp) - When the item was added to the list

## Access Control

Users can only access their own custom lists and list items. The `userId` in the document path must match the authenticated user's ID (`request.auth.uid`).