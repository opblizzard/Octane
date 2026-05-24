import type { Env } from '../index'
import { jsonResponse, errorResponse } from '../middleware/cors'

export async function handleAI(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url)

  if (request.method !== 'POST') return errorResponse('POST required', 405)

  const body = await request.json() as {
    message: string
    sessionId?: string
    context?: Record<string, unknown>
    model?: string
    stream?: boolean
  }

  const { message, sessionId = 'default', context, stream = false } = body

  if (!message?.trim()) return errorResponse('message required')

  // For streaming — client should use WebSocket /ws/ai/:sessionId instead
  // This REST endpoint handles non-streaming quick inference
  try {
    const systemPrompt = `You are Octane AI — a sovereign intelligence running on Cloudflare's global edge network, built on Ion AI architecture. Be precise, technical, and direct. ${context ? `\n\nPlatform context: ${JSON.stringify(context)}` : ''}`

    const response = await env.AI.run(
      '@cf/meta/llama-3.1-8b-instruct' as Parameters<typeof env.AI.run>[0],
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: message },
        ],
      } as Parameters<typeof env.AI.run>[1]
    ) as { response: string }

    return jsonResponse({
      role:      'assistant',
      content:   response.response,
      sessionId,
      ts:        Date.now(),
      model:     '@cf/meta/llama-3.1-8b-instruct',
    })

  } catch (err) {
    return errorResponse(`AI inference failed: ${String(err)}`, 500)
  }
}
