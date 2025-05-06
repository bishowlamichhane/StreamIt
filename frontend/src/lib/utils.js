// src/lib/utils.js

/**
 * Combines multiple class names into a single string
 * @param {...string} classes - Class names to combine
 * @returns {string} - Combined class names
 */
export function clsx(...classes) {
  return classes.filter(Boolean).join(" ")
}

/**
 * Combines multiple class names into a single string (alias for clsx)
 * @param {...string} classes - Class names to combine
 * @returns {string} - Combined class names
 */
export function cn(...classes) {
  return clsx(...classes)
}
