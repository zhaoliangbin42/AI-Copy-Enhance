# Contributing to AI-Markdone

Thank you for your interest in contributing! 🎉

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Screenshots** (if applicable)
- **Browser version** and extension version

## 💡 Feature Requests

Have an idea? We'd love to hear it! Open an issue with:
- **Use case** - Why is this feature needed?
- **Proposed solution** - How should it work?
- **Alternatives** - Any other approaches you've considered?

## 🔧 Pull Requests

### Setup
```bash
git clone https://github.com/yourusername/AI_Copy_Enhance.git
cd AI_Copy_Enhance
npm install
npm run dev
```

Load `dist/` in Chrome's extension page (`chrome://extensions/`) with Developer Mode enabled.

### Guidelines
1. **One feature per PR** - Keep changes focused
2. **Test thoroughly** - Test on ChatGPT/Gemini before submitting
3. **Follow code style** - TypeScript strict mode, use `logger` instead of `console.log`
4. **Update docs** - Add comments for complex logic
5. **Add to CHANGELOG** - Document your changes under `[Unreleased]`

### Code Style
- **TypeScript**: Strict mode, explicit return types
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Comments**: JSDoc for public methods
- **Logging**: Use `logger.debug/info/warn/error` (not `console.log`)
- **Shadow DOM**: All UI components must use Shadow DOM

### Architecture
- **Adapters**: Platform-specific logic in `src/content/adapters/`
- **Parsers**: Extraction logic in `src/content/parsers/`
- **Components**: UI in `src/content/components/` (Shadow DOM)
- **Features**: Standalone features in `src/content/features/`

See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.

### Testing
Manual testing checklist (run before submitting PR):
- [ ] Math formulas (inline + block)
- [ ] Tables with formulas
- [ ] Code blocks (Python, JavaScript, etc.)
- [ ] Streaming messages
- [ ] Click-to-copy math
- [ ] Word count (CJK + Latin)
- [ ] Re-render panel

### Commit Messages
Use conventional commits:
```
feat: add keyboard shortcuts
fix: streaming detection for Gemini
docs: update README installation steps
refactor: simplify table parser
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 📝 Documentation

Help improve our docs:
- Fix typos
- Add examples
- Clarify confusing sections
- Translate to other languages

## 🙏 Recognition

Contributors will be listed in:
- README.md
- GitHub contributors page
- Release notes

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
