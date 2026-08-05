# Project Structure

## Root files

- index.php: backend chính, router API, auth, upload, rebuild, JSON storage logic.
- index.html: entry point cho frontend hiện tại.
- router.php: routing helper cho server.
- package.json: scripts tiện ích cho local/dev.
- README.md: hướng dẫn chung và deployment.

## Main folders

- resources/: frontend assets and templates.
  - album-resource/: album viewer HTML/CSS/JS and locale JSON.
- scripts/: shell scripts cho start server, build images, deploy, setup domain.
- src/: source media and album folders.
  - albums/: ảnh gốc upload vào đây.
  - row/: ảnh tối ưu cho view row.
  - thumbs/: ảnh thumbnail.
  - audio/: audio files.
- storage/: JSON database và metadata như album titles, hidden flags, invitation data.
- vendor/: third-party libs như jQuery.

## Key runtime concepts

- Albums are stored per folder under src/albums/<album-name>.
- Generated images live under src/row/<album-name> and src/thumbs/<album-name>.
- UI loads album data from API routes and renders based on JSON metadata.
- Build scripts use shell tools and can fall back to PHP/GD in some environments.

## Important files to check first

- [index.php](../index.php)
- [resources/album-resource/album-viewer.js](../resources/album-resource/album-viewer.js)
- [resources/album-resource/album-viewer.html](../resources/album-resource/album-viewer.html)
- [scripts/build-album-images.sh](../scripts/build-album-images.sh)
- [scripts/prod-build-setup.sh](../scripts/prod-build-setup.sh)
