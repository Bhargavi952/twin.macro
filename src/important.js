import deepMerge from 'lodash.merge'

/**
 * Add important to a value
 * Only used for static and dynamic styles - not core plugins
 */
const mergeImportant = (style, hasImportant) => {
  if (!hasImportant) return style

  return Object.entries(style).reduce((accumulator, item) => {
    const [key, value] = item
    if (typeof value === 'object') {
      return mergeImportant(value, hasImportant)
    }

    return deepMerge(accumulator, { [key]: `${value} !important` })
  }, {})
}

/**
 * Split the important from the className
 */
const splitImportant = ({ className }) => {
  const hasPrefix = className.slice(0, 1) === '!'
  const hasSuffix = className.slice(-1) === '!'
  const hasImportant = hasSuffix || hasPrefix

  if (hasImportant) {
    className = hasSuffix ? className.slice(0, -1) : className.slice(1)
  }

  const important = hasImportant ? ' !important' : ''

  return { className, hasImportant, important }
}

export { splitImportant, mergeImportant }
