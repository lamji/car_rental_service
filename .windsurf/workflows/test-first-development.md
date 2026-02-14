---
description: Test-first development with Jest and test IDs for automated testing
---

# Test-First Development Rule

## 1. Always Add Test IDs to Components
- **Every component** must have `data-testid` attributes
- **Test IDs naming**: Use kebab-case, descriptive names
- **Test IDs placement**: On interactive elements and key display elements
- **Consistent naming**: `component-name-element-name` pattern

### Test ID Examples:
```tsx
// ✅ Good - Descriptive test IDs
<button data-testid="booking-form-submit-button">Submit</button>
<input data-testid="date-picker-start-date" />
<div data-testid="booking-confirmation-message" />

// ❌ Bad - Non-descriptive or missing test IDs
<button>Submit</button>
<div data-testid="btn1" />
```

## 2. Test Functions Before Implementation
- **Write tests FIRST** before implementing any function
- **Test the contract**: Define expected inputs and outputs
- **Edge cases**: Test boundary conditions and error scenarios
- **Integration tests**: Test complete workflows

### Test-First Workflow:
1. **Write failing test** that describes the desired behavior
2. **Implement minimal code** to make the test pass
3. **Refactor** while keeping tests green
4. **Add more tests** for edge cases
5. **Only then proceed** to next task

## 3. Required Test Coverage
- **Unit tests**: Every helper function must have tests
- **Integration tests**: Complete user workflows
- **Component tests**: UI interactions with test IDs
- **Coverage minimum**: 90%+ before proceeding

## 4. Test Structure Guidelines

### Unit Test Structure:
```typescript
describe('functionName', () => {
  describe('when condition X', () => {
    it('should do Y', () => {
      // Arrange
      const input = createMockInput();
      
      // Act
      const result = functionName(input);
      
      // Assert
      expect(result).toEqual(expectedOutput);
    });
  });
});
```

### Component Test Structure:
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    
    expect(screen.getByTestId('component-name-element')).toBeInTheDocument();
  });
  
  it('should handle user interaction', () => {
    render(<ComponentName />);
    
    fireEvent.click(screen.getByTestId('component-name-button'));
    
    expect(screen.getByTestId('component-name-result')).toHaveTextContent('Expected');
  });
});
```

## 5. Before Starting Any Task
1. **Write tests first** for the new functionality
2. **Ensure all existing tests pass**
3. **Add test IDs** to any components you'll modify
4. **Run tests** to verify they fail initially
5. **Implement code** to make tests pass
6. **Only proceed** when all tests pass with good coverage

## 6. Test ID Naming Convention
- **Pattern**: `feature-component-element`
- **Examples**:
  - `booking-form-submit-button`
  - `date-picker-start-date-input`
  - `time-selection-end-time-dropdown`
  - `validation-error-message`

## 7. Automated Testing Requirements
- **Pre-commit hooks**: Run tests automatically
- **CI/CD**: All tests must pass before merge
- **Coverage reports**: Generate and review coverage
- **Test IDs**: Enable reliable UI automation tests

## 8. Benefits of Test-First Development
- **Better design**: Forces thinking about requirements first
- **Regression prevention**: Catches breaking changes immediately
- **Documentation**: Tests serve as living documentation
- **Refactoring safety**: Enables confident code changes
- **Quality assurance**: Ensures code works as expected

## 9. Code Review Checklist
- [ ] Test IDs added to all new/modified components
- [ ] Tests written before implementation
- [ ] All tests pass (100% success rate)
- [ ] Coverage meets minimum requirements (90%+)
- [ ] Test IDs follow naming convention
- [ ] Tests cover edge cases and error scenarios
- [ ] Integration tests included for workflows

## 10. Enforcement Rules
- **No implementation without tests first**
- **No merge without test coverage**
- **No component without test IDs**
- **No task completion without passing tests**

---

**Remember**: Tests are not optional - they are mandatory first steps, not afterthoughts.
