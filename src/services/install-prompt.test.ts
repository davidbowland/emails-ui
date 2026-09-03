type PromptModule = typeof import('./install-prompt')

describe('install-prompt', () => {
  // The module captures `beforeinstallprompt` at import time, so each test loads a
  // fresh copy to start from a clean module state rather than sharing the capture.
  const loadModule = async (): Promise<PromptModule> => {
    jest.resetModules()
    return import('./install-prompt')
  }

  // A `beforeinstallprompt`-shaped event: a real Event (so `window.dispatchEvent`
  // and `preventDefault` behave) carrying the `prompt`/`userChoice` the module reads.
  const makePromptEvent = (outcome: 'accepted' | 'dismissed' = 'accepted') => {
    const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
      prompt: jest.Mock
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
    }
    event.prompt = jest.fn(() => Promise.resolve())
    event.userChoice = Promise.resolve({ outcome })
    return event
  }

  describe('capture', () => {
    it('has no deferred prompt before beforeinstallprompt fires', async () => {
      const module = await loadModule()

      expect(module.getDeferredPrompt()).toBeNull()
      expect(module.wasPromptOffered()).toBe(false)
    })

    it('captures the deferred prompt after beforeinstallprompt fires', async () => {
      const module = await loadModule()
      const event = makePromptEvent()

      window.dispatchEvent(event)

      expect(module.getDeferredPrompt()).toBe(event)
    })

    it('prevents the browser default so our offer is the only one', async () => {
      await loadModule()
      const event = makePromptEvent()

      window.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(true)
    })

    it('marks the prompt as offered once beforeinstallprompt fires', async () => {
      const module = await loadModule()

      window.dispatchEvent(makePromptEvent())

      expect(module.wasPromptOffered()).toBe(true)
    })

    it('clears the deferred prompt and marks installed on appinstalled', async () => {
      const module = await loadModule()
      window.dispatchEvent(makePromptEvent())

      window.dispatchEvent(new Event('appinstalled'))

      expect(module.getDeferredPrompt()).toBeNull()
      expect(module.isInstalled()).toBe(true)
    })

    it('keeps wasPromptOffered true after an install, so offered stays distinct from never-offered', async () => {
      const module = await loadModule()
      window.dispatchEvent(makePromptEvent())

      window.dispatchEvent(new Event('appinstalled'))

      expect(module.wasPromptOffered()).toBe(true)
    })

    it('reports not installed before appinstalled fires', async () => {
      const module = await loadModule()

      expect(module.isInstalled()).toBe(false)
    })
  })

  describe('promptInstall', () => {
    it('returns false when no prompt has been offered', async () => {
      const module = await loadModule()

      await expect(module.promptInstall()).resolves.toBe(false)
    })

    it('calls prompt() on the deferred event', async () => {
      const module = await loadModule()
      const event = makePromptEvent()
      window.dispatchEvent(event)

      await module.promptInstall()

      expect(event.prompt).toHaveBeenCalledTimes(1)
    })

    it('returns true when the person accepts', async () => {
      const module = await loadModule()
      window.dispatchEvent(makePromptEvent('accepted'))

      await expect(module.promptInstall()).resolves.toBe(true)
    })

    it('returns false when the person dismisses', async () => {
      const module = await loadModule()
      window.dispatchEvent(makePromptEvent('dismissed'))

      await expect(module.promptInstall()).resolves.toBe(false)
    })

    it('returns false when prompt() throws', async () => {
      const module = await loadModule()
      const event = makePromptEvent()
      event.prompt.mockRejectedValueOnce(new Error('InvalidStateError'))
      window.dispatchEvent(event)

      await expect(module.promptInstall()).resolves.toBe(false)
    })

    it('is single-use: a second call returns false', async () => {
      const module = await loadModule()
      window.dispatchEvent(makePromptEvent('accepted'))

      await module.promptInstall()

      await expect(module.promptInstall()).resolves.toBe(false)
    })

    it('clears the deferred prompt after use', async () => {
      const module = await loadModule()
      window.dispatchEvent(makePromptEvent('accepted'))

      await module.promptInstall()

      expect(module.getDeferredPrompt()).toBeNull()
    })

    it('leaves wasPromptOffered true after the prompt is spent', async () => {
      const module = await loadModule()
      window.dispatchEvent(makePromptEvent('accepted'))

      await module.promptInstall()

      expect(module.wasPromptOffered()).toBe(true)
    })
  })

  describe('subscribe', () => {
    it('notifies subscribers when a prompt is captured', async () => {
      const module = await loadModule()
      const listener = jest.fn()
      module.subscribe(listener)

      window.dispatchEvent(makePromptEvent())

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('notifies subscribers when the prompt is spent', async () => {
      const module = await loadModule()
      window.dispatchEvent(makePromptEvent('accepted'))
      const listener = jest.fn()
      module.subscribe(listener)

      await module.promptInstall()

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('stops notifying after unsubscribe', async () => {
      const module = await loadModule()
      const listener = jest.fn()
      const unsubscribe = module.subscribe(listener)

      unsubscribe()
      window.dispatchEvent(makePromptEvent())

      expect(listener).not.toHaveBeenCalled()
    })

    it('keeps notifying the rest when one subscriber throws', async () => {
      const module = await loadModule()
      const listener = jest.fn()
      module.subscribe(() => {
        throw new Error('broken subscriber')
      })
      module.subscribe(listener)

      window.dispatchEvent(makePromptEvent())

      expect(listener).toHaveBeenCalledTimes(1)
    })
  })
})
