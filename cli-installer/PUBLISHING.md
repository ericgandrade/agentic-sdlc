# Publishing Guide

## Publishing to npm

### Prerequisites

1. **npm Account**
   ```bash
   npm login
   ```

2. **Verify package.json**
   - Unique package name on npm: `agentic-sdlc-method`
   - Valid SemVer version
   - Git repository configured
   - Appropriate keywords

### Publishing Process

#### 1. Local Validation

```bash
# Test local installation
npm link

# Test commands
agentic-sdlc-method --version
agentic-sdlc-method doctor
agentic-sdlc-method list
agentic-sdlc-method install --help

# Uninstall link
npm unlink -g agentic-sdlc-method
```

#### 2. Dry Run

```bash
# Simulate publication without publishing
npm publish --dry-run
```

Verify:
- ✅ Only necessary files included
- ✅ `.npmignore` working correctly
- ✅ Reasonable package size

#### 3. Initial Publication (v1.0.0)

```bash
# Publish version 1.0.0
npm publish
```

#### 4. Future Updates

**Patch (bug fixes):** 1.0.0 → 1.0.1
```bash
npm version patch
npm publish
```

**Minor (new features):** 1.0.0 → 1.1.0
```bash
npm version minor
npm publish
```

**Major (breaking changes):** 1.0.0 → 2.0.0
```bash
npm version major
npm publish
```

### Verify Publication

```bash
# Search on npm registry
npm search agentic-sdlc-method

# View package information
npm view agentic-sdlc-method

# Install globally from npm
npm install -g agentic-sdlc-method
```

### Post-Publication Tests

```bash
# In different directory
cd ~
npm install -g agentic-sdlc-method

# Test installation
agentic-sdlc-method --version
agentic-sdlc-method doctor
agentic-sdlc-method list

# Test skills installation
agentic-sdlc-method install skill-creator --yes

# Check installed skills
agentic-sdlc-method list

# Update
agentic-sdlc-method update --yes

# Uninstall skill
agentic-sdlc-method uninstall skill-creator

# Uninstall CLI
npm uninstall -g agentic-sdlc-method
```

---

## Publication Checklist

### Before Publishing

- [ ] All commands working
  - [ ] `install` (interactive and --yes)
  - [ ] `list` (shows available skills)
  - [ ] `update` (detects outdated and updates)
  - [ ] `uninstall` (removes skills)
  - [ ] `doctor` (complete diagnostics)
- [ ] README.md complete and updated
- [ ] package.json with correct information
- [ ] .npmignore configured
- [ ] `npm link` tested locally
- [ ] `npm publish --dry-run` validated
- [ ] Correct SemVer version (1.0.0 for first publication)
- [ ] Tests on multiple platforms (macOS, Linux, Windows)

### During Publication

- [ ] `npm login` executed
- [ ] `npm publish` without errors
- [ ] Package appears at https://www.npmjs.com/package/agentic-sdlc-method

### After Publication

- [ ] Install globally: `npm install -g agentic-sdlc-method`
- [ ] Test main commands
- [ ] Install test skill
- [ ] Update main repository documentation
- [ ] Create release tag on GitHub
- [ ] Announce in main repo README

---

## Maintenance Commands

### Update Dependencies

```bash
# Check for outdated versions
npm outdated

# Update dependencies
npm update

# Check for vulnerabilities
npm audit
npm audit fix
```

### Deprecate Version

```bash
# Deprecate specific version
npm deprecate agentic-sdlc-method@1.0.0 "Version discontinued, use 1.1.0+"
```

### Remove Version (use with caution!)

```bash
# Remove published version (only first 72h)
npm unpublish agentic-sdlc-method@1.0.0
```

---

## Troubleshooting

### Error: Package name already exists

- Change the name in `package.json` to something unique
- Check availability: `npm search <name>`

### Error: No permission to publish

- Run `npm login` again
- Verify npm credentials

### Error: Files missing in published package

- Verify `.npmignore`
- Use `npm publish --dry-run` to see included files
- `files` field in package.json lists included files/directories

### Package too large

- Add unnecessary files to `.npmignore`
- Remove unused dev dependencies
- Ideal size: < 100KB (this package: ~50KB)

---

## References

- [npm Publishing Guide](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [SemVer Specification](https://semver.org/)
- [npm Package Scope](https://docs.npmjs.com/cli/v10/using-npm/scope)
