import { FREE_MODELS } from '../constants/freeModels.js'

export function validateModels(req, res, next) {
  const { models } = req.body
  
  if (!Array.isArray(models) || models.length !== 4) {
    return res.status(400).json({ error: 'Must select exactly 4 models' })
  }
  
  const invalidModels = models.filter(model => !FREE_MODELS.includes(model))
  
  if (invalidModels.length > 0) {
    return res.status(400).json({ 
      error: `Invalid models: ${invalidModels.join(', ')}. Only free models allowed.` 
    })
  }
  
  next()
}