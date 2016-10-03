import dotprop from 'dot-prop'

export default function mergeIncludedModels({ data, meta, included }) {
  Object.keys(meta.included || {}).forEach((type) => {
    meta.included[type].forEach((path) => {
      data.forEach((item) => {
        const id = dotprop.get(item, path)
        const model = included[type].find((o) => o._id === id)
        dotprop.set(item, path, model)
      })
    })
  })
  return data
}

