import type { Env } from '../index'
import { jsonResponse, errorResponse } from '../middleware/cors'

export interface ImageGenRequest {
  prompt:    string
  negative?: string
  width?:    number
  height?:   number
  steps?:    number
  guidance?: number
  seed?:     number
  model?:    string
  sampler?:  string
}

export async function handleImageGen(
  request: Request, env: Env, ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url)

  // List available models
  if (url.pathname === '/api/imagegen/models') {
    return jsonResponse({
      models: [
        { id: '@cf/stabilityai/stable-diffusion-xl-base-1.0', label: 'SDXL Base 1.0', type: 'cf' },
        { id: '@cf/lykon/dreamshaper-8-lcm',                  label: 'DreamShaper 8 LCM', type: 'cf' },
        { id: '@cf/bytedance/stable-diffusion-xl-lightning',  label: 'SDXL Lightning',  type: 'cf' },
        { id: 'external',                                      label: 'External Endpoint', type: 'ext' },
      ],
    })
  }

  if (request.method !== 'POST') return errorResponse('POST required', 405)

  const body = await request.json() as ImageGenRequest
  const {
    prompt,
    negative = '',
    width    = 1024,
    height   = 1024,
    steps    = 20,
    guidance = 7.5,
    seed,
    model    = '@cf/stabilityai/stable-diffusion-xl-base-1.0',
  } = body

  if (!prompt?.trim()) return errorResponse('prompt required')

  // External endpoint (user-configured)
  if (model === 'external' && env.IMGGEN_ENDPOINT) {
    const res = await fetch(env.IMGGEN_ENDPOINT, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.IMGGEN_API_KEY ? { Authorization: `Bearer ${env.IMGGEN_API_KEY}` } : {}),
      },
      body: JSON.stringify({ prompt, negative_prompt: negative, width, height, steps, cfg_scale: guidance, seed }),
    })
    const data = await res.arrayBuffer()
    return new Response(data, {
      headers: { 'Content-Type': 'image/png', 'X-Octane-Model': 'external' },
    })
  }

  // Cloudflare Workers AI image generation
  try {
    const inputs: Record<string, unknown> = {
      prompt,
      negative_prompt: negative,
      width,
      height,
      num_steps: steps,
      guidance,
    }
    if (seed !== undefined) inputs.seed = seed

    const response = await env.AI.run(
      model as Parameters<typeof env.AI.run>[0],
      inputs as Parameters<typeof env.AI.run>[1]
    ) as ReadableStream | { image: string }

    if (response instanceof ReadableStream) {
      return new Response(response, {
        headers: {
          'Content-Type': 'image/png',
          'X-Octane-Model': model,
          'X-Octane-Steps': String(steps),
        },
      })
    }

    // Base64 response
    if ('image' in response) {
      const binary = atob(response.image)
      const bytes  = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      return new Response(bytes, {
        headers: { 'Content-Type': 'image/png', 'X-Octane-Model': model },
      })
    }

    return errorResponse('Unexpected AI response format', 500)

  } catch (err) {
    return errorResponse(`Image generation failed: ${String(err)}`, 500)
  }
}
