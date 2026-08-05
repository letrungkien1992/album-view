# Deployment Checklist

## Before deploy

- [ ] Verify PHP syntax: `php -l index.php`
- [ ] Verify frontend syntax: `node --check resources/album-resource/album-viewer.js`
- [ ] Confirm scripts are executable
- [ ] Ensure required PHP extensions are installed: `ZipArchive`, `GD`, `imagewebp`

## After upload to server

- [ ] Run production permission setup: `APP_USER=www-data APP_GROUP=www-data bash scripts/prod-build-setup.sh`
- [ ] Ensure storage/, resources/, src/albums, src/row, src/thumbs are writable
- [ ] Check build log if rebuild fails
- [ ] Test access to `/__albums__` and rebuild route

## Post-deploy smoke test

- [ ] Open homepage
- [ ] Upload album or rebuild album
- [ ] Confirm row/thumbs are generated
- [ ] Confirm admin actions appear only for admin role
