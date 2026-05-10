---
title: Example Source Summary
type: source
author: Example Author
date: 2024-05-10
url: https://example.com/article
tags: [example, accessibility, angular]
created: 2024-05-10
---

# Example Source Summary

## Metadata

- **Author**: Example Author
- **Date**: 2024-05-10
- **URL**: [Example Article](https://example.com/article)
- **Type**: article
- **Raw Source**: `raw/articles/example-article.md`

## Key Points

- Accessibility should be built into components from the start, not added as an afterthought
- Using semantic HTML provides a strong foundation for accessible experiences
- ARIA attributes enhance but should not replace native HTML semantics
- Testing with keyboard navigation and screen readers is essential
- Progressive enhancement ensures content works for all users

## Insights

This source emphasizes the importance of **accessibility-first design** in modern web development. Rather than treating accessibility as a compliance checkbox, developers should integrate accessible patterns into their component architecture from the beginning.

The article highlights that many accessibility issues stem from using generic `<div>` and `<span>` elements instead of semantic HTML. By choosing the right HTML element (`<button>`, `<nav>`, `<main>`, etc.), developers get built-in keyboard support and screen reader compatibility for free.

**Key Takeaway**: Accessibility is not a feature to add later—it's a fundamental aspect of good component design that benefits all users.

## Relevant Entities

- [[angular-cdk]] - Provides accessible component primitives
- [[screen-reader]] - Assistive technology for visually impaired users
- [[keyboard-navigation]] - Essential interaction pattern for accessibility

## Relevant Concepts

- [[progressive-enhancement]] - Design strategy that ensures baseline accessibility
- [[semantic-html]] - Foundation of accessible web content
- [[aria-patterns]] - Enhanced accessibility through ARIA attributes

## Quotes

> "Accessibility is not a feature. It's a fundamental aspect of building software that works for everyone."

> "The best ARIA is no ARIA. Use semantic HTML first, then enhance with ARIA only when necessary."

> "If you can't use your application with just a keyboard, it's not accessible."
