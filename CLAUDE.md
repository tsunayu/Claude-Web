# CLAUDE.md - AI Assistant Guide for Claude-Web

This document provides comprehensive guidance for AI assistants working on the Claude-Web project. It outlines the codebase structure, development workflows, conventions, and best practices.

**Last Updated**: 2025-11-18
**Repository**: tsunayu/Claude-Web

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [Technology Stack](#technology-stack)
4. [Development Workflow](#development-workflow)
5. [Code Conventions](#code-conventions)
6. [AI Assistant Guidelines](#ai-assistant-guidelines)
7. [Git Practices](#git-practices)
8. [Testing Strategy](#testing-strategy)
9. [Documentation Standards](#documentation-standards)
10. [Common Tasks](#common-tasks)

---

## Project Overview

**Claude-Web** is a modern web application project designed to be developed with AI assistance. This project emphasizes:

- Clean, maintainable code architecture
- AI-friendly documentation and conventions
- Modern web development best practices
- Comprehensive testing and quality assurance
- Clear separation of concerns

### Project Goals

- Build a scalable, performant web application
- Maintain high code quality and consistency
- Enable efficient AI-assisted development
- Foster clear communication between human developers and AI assistants

---

## Repository Structure

The project follows a standard modern web application structure:

```
Claude-Web/
├── .git/                   # Git repository metadata
├── src/                    # Source code
│   ├── components/        # Reusable UI components
│   ├── pages/             # Page-level components/routes
│   ├── services/          # Business logic and API services
│   ├── utils/             # Utility functions and helpers
│   ├── hooks/             # Custom React hooks (if using React)
│   ├── styles/            # Global styles and theme
│   ├── types/             # TypeScript type definitions
│   ├── config/            # Configuration files
│   └── assets/            # Static assets (images, fonts, etc.)
├── public/                # Public static files
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
├── docs/                  # Project documentation
├── scripts/               # Build and utility scripts
├── .github/               # GitHub-specific files (workflows, templates)
├── package.json           # Project dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── .eslintrc.js          # ESLint configuration
├── .prettierrc           # Prettier configuration
├── .gitignore            # Git ignore rules
├── README.md             # Project overview and setup instructions
└── CLAUDE.md             # This file - AI assistant guide

```

### Key Directories

- **`src/`**: All application source code
- **`src/components/`**: Reusable, self-contained UI components
- **`src/pages/`**: Top-level route/page components
- **`src/services/`**: API clients, data fetching, business logic
- **`src/utils/`**: Pure utility functions, helpers, formatters
- **`tests/`**: All test files, organized by test type

---

## Technology Stack

### Recommended Stack (Update as project evolves)

**Frontend Framework**: (TBD - React, Vue, Svelte, etc.)
**Language**: TypeScript (strongly recommended for type safety)
**Styling**: (TBD - CSS Modules, Tailwind, styled-components, etc.)
**Build Tool**: (TBD - Vite, webpack, etc.)
**Package Manager**: npm or yarn
**Testing**: Jest, Vitest, or similar
**Linting**: ESLint + Prettier
**Version Control**: Git + GitHub

### Key Dependencies

- Runtime dependencies in `dependencies`
- Development tools in `devDependencies`
- Keep dependencies up-to-date but test thoroughly before upgrading

---

## Development Workflow

### Branch Strategy

1. **Main Branch**: `main` or `master` - production-ready code
2. **Feature Branches**: `claude/[feature-name]-[session-id]` - for AI-assisted development
3. **Development Branch**: `develop` - integration branch (if needed)

### Workflow Steps

1. **Start Work**
   - Create feature branch from main
   - Branch naming: `claude/[descriptive-name]-[session-id]`

2. **Development**
   - Write code following conventions
   - Write tests alongside features
   - Update documentation as needed
   - Commit frequently with clear messages

3. **Code Quality**
   - Run linters and formatters
   - Fix all lint errors before committing
   - Ensure tests pass
   - Check for security vulnerabilities

4. **Commit & Push**
   - Write descriptive commit messages
   - Push to feature branch: `git push -u origin [branch-name]`
   - Ensure branch name starts with `claude/` and matches session ID

5. **Pull Request**
   - Create PR with clear description
   - Include summary of changes
   - List test plan and verification steps
   - Request review if applicable

---

## Code Conventions

### General Principles

1. **Clarity over Cleverness**: Write code that's easy to read and understand
2. **DRY (Don't Repeat Yourself)**: Extract reusable logic
3. **SOLID Principles**: Follow object-oriented design principles
4. **Single Responsibility**: Each function/component should do one thing well
5. **Consistent Naming**: Use clear, descriptive names

### Naming Conventions

- **Files**: `camelCase.ts` or `kebab-case.ts` (choose one, be consistent)
- **Components**: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- **Functions**: `camelCase` (e.g., `getUserData`, `handleClick`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)
- **Interfaces/Types**: `PascalCase` (e.g., `UserProfile`, `ApiResponse`)
- **Private properties**: `_prefixedCamelCase` or use TypeScript private keyword

### TypeScript Guidelines

```typescript
// Use explicit types for function parameters and return values
function getUserById(id: string): Promise<User | null> {
  // Implementation
}

// Use interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// Use type for unions, intersections, and aliases
type Status = 'pending' | 'active' | 'inactive';
type UserWithStatus = User & { status: Status };

// Avoid 'any' - use 'unknown' if type is truly unknown
function processData(data: unknown): void {
  // Type guard before use
  if (typeof data === 'string') {
    console.log(data.toUpperCase());
  }
}
```

### Component Structure (React Example)

```typescript
// 1. Imports (external, then internal)
import React, { useState, useEffect } from 'react';
import { UserService } from '../services/UserService';
import { Button } from '../components/Button';

// 2. Types/Interfaces
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

// 3. Component
export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // 3a. Hooks
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 3b. Effects
  useEffect(() => {
    loadUser();
  }, [userId]);

  // 3c. Event handlers
  const handleUpdate = () => {
    // Implementation
  };

  // 3d. Helper functions
  const loadUser = async () => {
    // Implementation
  };

  // 3e. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Error Handling

```typescript
// Always handle errors explicitly
try {
  const data = await fetchData();
  return data;
} catch (error) {
  // Log with context
  console.error('Failed to fetch data:', error);
  // Handle appropriately
  throw new Error('Data fetch failed');
}

// Use custom error classes when appropriate
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### Comments

```typescript
// Use comments to explain WHY, not WHAT
// Good:
// Using debounce to prevent excessive API calls during typing
const debouncedSearch = debounce(handleSearch, 300);

// Bad:
// This debounces the search function with 300ms delay
const debouncedSearch = debounce(handleSearch, 300);

// Document complex logic
/**
 * Calculates the user's tier based on their activity score.
 *
 * Tier calculation:
 * - Bronze: 0-100 points
 * - Silver: 101-500 points
 * - Gold: 501+ points
 *
 * @param activityScore - User's total activity score
 * @returns The user's tier level
 */
function calculateUserTier(activityScore: number): string {
  // Implementation
}
```

---

## AI Assistant Guidelines

### When Working on This Project

1. **Read Before Writing**
   - Always read existing files before editing
   - Understand the current implementation
   - Follow established patterns and conventions

2. **Plan Complex Tasks**
   - Use TodoWrite for tasks with 3+ steps
   - Break down large features into smaller tasks
   - Track progress and mark tasks complete promptly

3. **Code Quality**
   - Follow TypeScript best practices
   - Write type-safe code (avoid `any`)
   - Handle errors explicitly
   - Add appropriate comments for complex logic
   - Ensure no security vulnerabilities (XSS, SQL injection, etc.)

4. **Testing**
   - Write tests for new features
   - Update tests when modifying code
   - Ensure all tests pass before committing
   - Include edge cases and error scenarios

5. **Documentation**
   - Update README when adding features
   - Document API endpoints and interfaces
   - Keep CLAUDE.md current with project changes
   - Add inline documentation for complex functions

6. **Git Practices**
   - Write clear, descriptive commit messages
   - Commit related changes together
   - Don't commit sensitive data (.env, credentials)
   - Push to correct branch (`claude/` prefix required)

7. **Communication**
   - Provide concise, clear responses
   - Avoid unnecessary emojis
   - Reference code locations: `file_path:line_number`
   - Ask for clarification when requirements are unclear

8. **Performance**
   - Use parallel tool calls when possible
   - Prefer specialized tools over bash commands
   - Use Task tool for complex searches
   - Optimize for efficiency

### What NOT to Do

- ❌ Don't create unnecessary files (especially .md files)
- ❌ Don't use emojis unless explicitly requested
- ❌ Don't commit without explicit request
- ❌ Don't push to wrong branch (must start with `claude/`)
- ❌ Don't skip error handling
- ❌ Don't use `any` type without good reason
- ❌ Don't write insecure code
- ❌ Don't modify code without understanding it

---

## Git Practices

### Commit Message Format

```
<type>: <short summary>

<optional detailed description>

<optional footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat: add user authentication with JWT

Implements login/logout functionality using JWT tokens.
Includes password hashing with bcrypt and token refresh.

feat: add dark mode toggle

fix: resolve memory leak in event listeners

Clean up event listeners on component unmount to prevent
memory leaks.

docs: update API documentation for user endpoints

test: add integration tests for payment flow
```

### Branch Management

```bash
# Create and switch to feature branch
git checkout -b claude/add-user-auth-[session-id]

# Stage changes
git add src/components/UserAuth.tsx

# Commit with message
git commit -m "feat: add user authentication component"

# Push to remote (use -u for first push)
git push -u origin claude/add-user-auth-[session-id]
```

### Pull Request Guidelines

**PR Title**: Clear, concise description of changes

**PR Description Template**:
```markdown
## Summary
- Brief overview of changes
- Key features/fixes implemented

## Changes Made
- Detailed list of modifications
- New files created
- Dependencies added

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Edge cases verified

## Screenshots/Demos
(if applicable)

## Breaking Changes
(if any)

## Notes for Reviewers
(any specific areas to focus on)
```

---

## Testing Strategy

### Test Organization

```
tests/
├── unit/              # Fast, isolated tests
│   ├── components/   # Component unit tests
│   └── utils/        # Utility function tests
├── integration/       # Tests for module interactions
│   └── services/     # Service integration tests
└── e2e/              # End-to-end user flow tests
    └── user-flows/   # Complete user scenarios
```

### Testing Guidelines

1. **Unit Tests**
   - Test individual functions/components in isolation
   - Mock external dependencies
   - Fast execution (< 100ms per test)
   - High coverage for utils and core logic

2. **Integration Tests**
   - Test module interactions
   - Test API integrations
   - Verify data flow between components

3. **E2E Tests**
   - Test critical user flows
   - Test from user perspective
   - Verify complete features work end-to-end

### Test Naming Convention

```typescript
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when valid ID is provided', async () => {
      // Test implementation
    });

    it('should return null when user is not found', async () => {
      // Test implementation
    });

    it('should throw error when ID is invalid', async () => {
      // Test implementation
    });
  });
});
```

### Test Coverage Goals

- **Overall**: 80%+ coverage
- **Utils/Core Logic**: 90%+ coverage
- **Components**: 70%+ coverage
- **Integration**: Critical paths covered

---

## Documentation Standards

### Code Documentation

1. **Public APIs**: Always document with JSDoc
2. **Complex Logic**: Add explanatory comments
3. **Type Definitions**: Include descriptions for non-obvious types
4. **Configuration**: Document all config options

### JSDoc Example

```typescript
/**
 * Fetches user data from the API with optional filters.
 *
 * @param userId - The unique identifier of the user
 * @param options - Optional configuration for the request
 * @param options.includeMetadata - Whether to include user metadata
 * @param options.format - Response format (json or xml)
 * @returns Promise resolving to user data or null if not found
 * @throws {NetworkError} When the request fails
 * @throws {ValidationError} When userId is invalid
 *
 * @example
 * ```typescript
 * const user = await getUser('123', { includeMetadata: true });
 * if (user) {
 *   console.log(user.name);
 * }
 * ```
 */
async function getUser(
  userId: string,
  options?: {
    includeMetadata?: boolean;
    format?: 'json' | 'xml';
  }
): Promise<User | null> {
  // Implementation
}
```

### README.md Structure

Every project should have:

1. **Project Title & Description**
2. **Features**
3. **Prerequisites**
4. **Installation**
5. **Usage**
6. **Configuration**
7. **Development**
8. **Testing**
9. **Deployment**
10. **Contributing**
11. **License**

---

## Common Tasks

### Adding a New Feature

1. Create feature branch
2. Plan implementation (use TodoWrite for complex features)
3. Write tests first (TDD approach recommended)
4. Implement feature
5. Ensure tests pass
6. Update documentation
7. Commit and push
8. Create pull request

### Fixing a Bug

1. Reproduce the bug
2. Write a failing test that demonstrates the bug
3. Fix the bug
4. Verify test now passes
5. Check for similar issues elsewhere
6. Commit with descriptive message
7. Push and create PR if needed

### Updating Dependencies

1. Check for updates: `npm outdated`
2. Update one dependency at a time
3. Run tests after each update
4. Check for breaking changes in changelogs
5. Update code if needed
6. Commit each dependency update separately

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- path/to/test.spec.ts

# Run with coverage
npm test -- --coverage
```

### Code Quality Checks

```bash
# Lint code
npm run lint

# Fix auto-fixable lint issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check
```

---

## Security Considerations

### Common Vulnerabilities to Avoid

1. **XSS (Cross-Site Scripting)**
   - Sanitize user input
   - Use framework's built-in escaping
   - Validate and encode output

2. **SQL Injection**
   - Use parameterized queries
   - Never concatenate user input into queries
   - Use ORM/query builders properly

3. **Authentication/Authorization**
   - Store passwords hashed (bcrypt, argon2)
   - Use secure session management
   - Implement proper access controls
   - Use HTTPS only

4. **Sensitive Data**
   - Never commit secrets (.env files)
   - Use environment variables
   - Rotate credentials regularly
   - Don't log sensitive information

5. **Dependencies**
   - Regularly update dependencies
   - Use `npm audit` to check for vulnerabilities
   - Review security advisories

### Security Checklist

- [ ] Input validation on all user data
- [ ] Output encoding/escaping
- [ ] Authentication implemented correctly
- [ ] Authorization checks in place
- [ ] Secrets in environment variables
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Dependencies up-to-date
- [ ] Error messages don't leak sensitive info

---

## Performance Best Practices

1. **Code Splitting**: Load code on demand
2. **Lazy Loading**: Defer non-critical resources
3. **Memoization**: Cache expensive computations
4. **Debouncing/Throttling**: Limit expensive operations
5. **Optimize Images**: Compress and use appropriate formats
6. **Minimize Bundle Size**: Tree-shake unused code
7. **Use Production Builds**: Enable optimizations

---

## Accessibility Guidelines

1. **Semantic HTML**: Use appropriate HTML elements
2. **ARIA Labels**: Add labels for screen readers
3. **Keyboard Navigation**: All interactive elements keyboard-accessible
4. **Color Contrast**: Meet WCAG 2.1 AA standards
5. **Focus Indicators**: Visible focus states
6. **Alt Text**: Descriptive text for images
7. **Form Labels**: All inputs properly labeled

---

## Environment Variables

### Required Variables

```bash
# .env.example (commit this)
NODE_ENV=development
API_BASE_URL=https://api.example.com
APP_PORT=3000

# .env (DO NOT commit this)
# Copy from .env.example and fill in actual values
API_KEY=your_secret_key_here
DATABASE_URL=your_database_connection_string
```

### Usage

```typescript
// Access environment variables
const apiKey = process.env.API_KEY;
const apiUrl = process.env.API_BASE_URL;

// Validate required variables at startup
if (!process.env.API_KEY) {
  throw new Error('API_KEY environment variable is required');
}
```

---

## Troubleshooting

### Common Issues

1. **Module not found**
   - Run `npm install`
   - Check import paths
   - Verify file exists

2. **Type errors**
   - Check TypeScript configuration
   - Verify type definitions installed
   - Update `@types/*` packages

3. **Tests failing**
   - Check test environment setup
   - Verify mocks are correct
   - Clear test cache

4. **Build errors**
   - Clear build cache
   - Delete `node_modules` and reinstall
   - Check for dependency conflicts

---

## Additional Resources

- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **React Documentation**: https://react.dev/
- **Testing Best Practices**: https://testingjavascript.com/
- **Git Best Practices**: https://git-scm.com/book/en/v2
- **Security Guidelines**: https://owasp.org/

---

## Changelog

### 2025-11-18
- Initial creation of CLAUDE.md
- Established project structure and conventions
- Defined AI assistant guidelines
- Added comprehensive development workflow

---

## Contact & Support

For questions or issues:
- Create an issue in the GitHub repository
- Contact the project maintainer
- Refer to documentation in `/docs`

---

**Remember**: This document is a living guide. Update it as the project evolves, new patterns emerge, or conventions change. AI assistants should always refer to this document when working on the project and suggest updates when they notice gaps or outdated information.
