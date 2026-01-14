# Contributing to MediaCMS

How to contribute code to MediaCMS.

## Before You Start

1. **Read Code of Conduct**: Check [CODE_OF_CONDUCT.md](../../../CODE_OF_CONDUCT.md)
2. **Set Up Development Environment**: See [Development Environment](development-environment.md)
3. **Understand the Codebase**: Review [System Architecture](../architecture/system-overview.md)

## Contribution Process

### Step 1: Create a Branch

```bash
git checkout -b feature/your-feature-name
```

Or for bug fixes:

```bash
git checkout -b fix/issue-description
```

### Step 2: Make Changes

- Write code following existing patterns
- Add tests for new functionality
- Update documentation if needed
- Follow code style guidelines

### Step 3: Format Code

Before committing, format your code:

```bash
# Install pre-commit hooks
pre-commit install

# Run checks
pre-commit run --all
```

Fix any issues before committing.

### Step 4: Write Tests

Add tests for new functionality:

```bash
# Run tests
make test

# Run specific test
docker compose -f docker-compose-dev.yaml exec --env TESTING=True -T api pytest tests/your_test.py
```

### Step 5: Update Documentation

If your changes affect:
- User-facing features: Update user guide
- Configuration: Update configuration reference
- API: Update API documentation
- Installation: Update installation guides

### Step 6: Commit Changes

```bash
git add .
git commit -m "Description of your changes"
```

**Commit Message Guidelines**:
- Use clear, descriptive messages
- Reference issue numbers if applicable
- Follow conventional commit format if possible

### Step 7: Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## Code Style

### Python

- Follow PEP 8
- Use Black for formatting
- Maximum line length: 88 characters (Black default)
- Use type hints where appropriate

### JavaScript/TypeScript

- Follow ESLint rules
- Use Prettier for formatting
- Use functional components and hooks
- Follow React best practices

### Django

- Follow Django coding style
- Use Django's built-in features
- Follow Django REST Framework patterns
- Write docstrings for functions/classes

## Testing Requirements

### Test Coverage

- Aim for high test coverage
- Test edge cases
- Test error conditions
- Test both success and failure paths

### Running Tests

```bash
# All tests
make test

# Specific test file
docker compose -f docker-compose-dev.yaml exec --env TESTING=True -T api pytest tests/test_file.py

# With coverage
docker compose -f docker-compose-dev.yaml exec --env TESTING=True -T api pytest --cov=. --cov-report=html
```

### Writing Tests

- Use pytest for Python tests
- Use Django's test client for API tests
- Mock external dependencies
- Use fixtures for test data

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Tests added for new functionality
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Pre-commit hooks pass

### PR Description

Include:
- Description of changes
- Why changes were made
- How to test
- Screenshots (if UI changes)
- Related issues

### Review Process

- Maintainers will review your PR
- Address feedback promptly
- Be open to suggestions
- Keep PR focused and small when possible

## Translation Requirements

If adding translatable strings:

1. **Mark as Translatable**:
   - Django templates: Use `{% trans %}` or `{% blocktrans %}`
   - React: Use `translateString()` function

2. **Add to English First**:
   - Add string to `files/frontend-translations/en.py`

3. **Process Translations**:
   ```bash
   python manage.py process_translations
   ```

4. **Translate**:
   - Translate to your language
   - Don't need to translate all languages

**Important**: PRs won't be accepted without running `process_translations`.

## Areas for Contribution

### High Priority

- Bug fixes
- Documentation improvements
- Test coverage
- Performance optimizations

### Feature Areas

- Media management
- User management
- Authentication
- Transcoding
- Frontend improvements
- API enhancements

## Getting Help

- **GitHub Discussions**: Ask questions
- **GitHub Issues**: Report bugs
- **Pull Requests**: Review existing PRs
- **Code Reviews**: Learn from reviews

## Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes
- Project documentation

Thank you for contributing to MediaCMS!

## Next Steps

- [Development Environment](development-environment.md) - Set up your environment
- [System Architecture](../architecture/system-overview.md) - Understand the codebase
- [API Reference](../architecture/api-reference.md) - API documentation
