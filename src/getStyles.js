import deepMerge from 'lodash.merge'
import { assert, isEmpty, getProperties, getTheme } from './utils'
import getPieces from './utils/getPieces'
import { astify } from './macroHelpers'
import doPrechecks, { precheckGroup } from './prechecks'
import { logGeneralError, errorSuggestions, debug } from './logging'
import { orderByScreens } from './screens'
import applyTransforms from './transforms'
import { addVariants } from './variants'
import {
  handleUserPlugins,
  handleCorePlugins,
  handleStatic,
  handleDynamic,
} from './handlers'

export default (classes, t, state) => {
  assert([null, 'null', undefined].includes(classes), () =>
    logGeneralError(
      'Only plain strings can be used with "tw".\nRead more at https://github.com/ben-rogerson/twin.macro/issues/17'
    )
  )

  // Move and sort the responsive items to the end of the list
  const classesOrdered = orderByScreens(classes, state)
  const theme = getTheme(state.config.theme)
  const hasUserPlugins = !isEmpty(state.config.plugins)

  // Merge styles into a single css object
  const styles = classesOrdered.reduce((results, classNameRaw) => {
    doPrechecks([precheckGroup], { classNameRaw })

    const pieces = getPieces({ classNameRaw, state })
    const { className } = pieces

    // Process addUtilities from plugins
    if (hasUserPlugins) {
      const style = handleUserPlugins({ config: state.config, className })
      if (!isEmpty(style)) {
        state.debug && debug(className, style)
        return deepMerge(results, style)
      }
    }

    const classProperties = getProperties(className)

    // Kick off suggestions when no class matches
    assert(!classProperties || classProperties.hasNoMatches, () =>
      errorSuggestions({ pieces, state })
    )

    const { dynamicKey, dynamicConfig, corePlugin, type } = classProperties

    const styleHandler = {
      static: () => handleStatic({ pieces }),
      dynamic: () =>
        handleDynamic({ theme, pieces, state, dynamicKey, dynamicConfig }),
      corePlugin: () =>
        handleCorePlugins({
          theme,
          pieces,
          state,
          corePlugin,
          classNameRaw,
          dynamicKey,
        }),
    }

    const style = applyTransforms({ type, pieces, style: styleHandler[type]() })

    const result = deepMerge(
      results,
      pieces.hasVariants ? addVariants({ results, style, pieces }) : style
    )

    state.debug && debug(classNameRaw, style)

    return result
  }, {})

  return astify(isEmpty(styles) ? {} : styles, t)
}
