---
description: Strict rule - No emoji usage in code, strings, or UI text
---

# No Emoji Rule - Strict Policy

## **Rule: Absolutely No Emojis**
- **STRICT PROHIBITION**: No emojis anywhere in codebase
- **Text content**: Use descriptive text instead of emojis
- **UI elements**: Use proper icons or text labels
- **Error messages**: Use clear, professional text
- **Success messages**: Use professional language
- **Console logs**: Use descriptive text only

## **Examples of What's FORBIDDEN:**
```typescript
// ❌ FORBIDDEN - Emojis in strings
title: "❌ System Error"
title: "🎉 Car is Available!"
message: "⏰ Please complete your booking"
console.log("🚀 User confirmed booking");

// ❌ FORBIDDEN - Emojis in comments
// 🎯 This function handles booking
// ⚠️ Warning: This may fail
```

## **Examples of What's REQUIRED:**
```typescript
// ✅ REQUIRED - Professional text only
title: "System Error"
title: "Car is Available"
message: "Please complete your booking within 2 minutes"
console.log("User confirmed booking");

// ✅ REQUIRED - Professional comments
// This function handles booking confirmation
// Warning: This operation may fail if network is unstable
```

## **Professional Alternatives:**

### **For Status Indicators:**
- **Instead of**: "❌ Error" → **Use**: "Error" or "Failed"
- **Instead of**: "✅ Success" → **Use**: "Success" or "Completed"
- **Instead of**: "⚠️ Warning" → **Use**: "Warning" or "Attention"
- **Instead of**: "ℹ️ Info" → **Use**: "Information" or "Notice"

### **For Actions:**
- **Instead of**: "🎉 Available!" → **Use**: "Available!" or "Ready"
- **Instead of**: "⏰ Time remaining" → **Use**: "Time remaining" or "Expires in"
- **Instead of**: "🚀 Launch" → **Use**: "Start" or "Begin"

### **For UI Elements:**
- **Use proper icons**: Lucide React icons, FontAwesome, etc.
- **Use text labels**: Clear, descriptive text
- **Use status colors**: Red for error, green for success, etc.

## **Enforcement:**
- **Code reviews**: Reject any code with emojis
- **Lint rules**: Configure ESLint to flag emoji usage
- **Pre-commit hooks**: Block commits with emojis
- **Team training**: Educate team on professional communication

## **Benefits:**
- **Professional appearance**: Clean, business-ready interface
- **Accessibility**: Better screen reader support
- **Internationalization**: Easier translation and localization
- **Consistency**: Uniform communication style
- **Maintainability**: Clear, unambiguous text

## **Quick Reference:**
| Emoji | Replacement |
|-------|-------------|
| ❌ | "Error" / "Failed" |
| ✅ | "Success" / "Completed" |
| ⚠️ | "Warning" / "Attention" |
| ℹ️ | "Info" / "Notice" |
| 🎉 | "Success!" / "Available!" |
| ⏰ | "Time" / "Expires" |
| 🚀 | "Start" / "Begin" |
| 📍 | "Location" / "Position" |
| 📅 | "Date" / "Schedule" |
| 💰 | "Price" / "Cost" |

---

**Remember**: Professional applications use professional language. Emojis belong in social media, not in business software.
