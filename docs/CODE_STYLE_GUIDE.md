# Portfolio Lens 代码风格指南

## 核心原则

### 1. React 组件职责分离
- **组件只负责渲染**：React 组件中不应存在与渲染无关的代码
- **业务逻辑抽离**：使用自定义 hooks 处理业务逻辑
- **单一职责**：每个组件只负责一个特定的 UI 功能

### 2. 函数长度限制
- **60 行限制**：无论是 React 组件还是普通函数，行数不应超过 60 行
- **大组件拆分**：超过 60 行的组件必须拆分为小组件
- **大函数拆分**：超过 60 行的函数必须拆分为小函数

### 3. 代码逻辑完整性
- **功能完整**：拆分后的代码必须保持逻辑完整性
- **可读性优先**：代码应该易于理解和维护

## React 组件规范

### 组件结构模板
```typescript
// ✅ 好的组件结构
interface ComponentProps {
  // 明确的 props 类型定义
}

export const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 1. 使用自定义 hooks 处理业务逻辑
  const { data, loading, error } = useCustomHook()
  
  // 2. 事件处理函数（简单逻辑）
  const handleClick = () => {
    // 简单逻辑，复杂逻辑放在 hook 中
  }
  
  // 3. 渲染逻辑
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  
  return (
    <div className="component">
      {/* JSX 内容 */}
    </div>
  )
}
```

### 组件拆分示例
```typescript
// ❌ 不好的做法：大组件包含业务逻辑
export const Settings: React.FC = () => {
  const [webhookSettings, setWebhookSettings] = useState<WebhookSettings>({...})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // 大量业务逻辑...
  const loadSettings = async () => { /* 复杂逻辑 */ }
  const saveSettings = async () => { /* 复杂逻辑 */ }
  const testWebhook = async () => { /* 复杂逻辑 */ }
  
  // 渲染逻辑...
}

// ✅ 好的做法：拆分后的组件
export const Settings: React.FC = () => {
  const { 
    webhookSettings, 
    isLoading, 
    isSaving, 
    saveMessage,
    handleWebhookChange,
    saveSettings,
    resetToDefaults 
  } = useWebhookSettings()
  
  const { testWebhook, testingWebhook } = useWebhookTest()
  
  if (isLoading) return <LoadingSpinner />
  
  return (
    <div className="space-y-6">
      <SettingsHeader />
      <SaveMessage message={saveMessage} />
      <WebhookSettingsForm 
        settings={webhookSettings}
        onWebhookChange={handleWebhookChange}
        onSave={saveSettings}
        onReset={resetToDefaults}
        isSaving={isSaving}
      />
      <WebhookTestSection 
        settings={webhookSettings}
        onTest={testWebhook}
        testingWebhook={testingWebhook}
      />
      <SettingsInstructions />
      <OtherSettings />
    </div>
  )
}
```

## 自定义 Hooks 规范

### Hook 命名规范
```typescript
// 业务逻辑 hooks：use + 业务名称
export const useWebhookSettings = () => {
  // 状态管理
  const [webhookSettings, setWebhookSettings] = useState<WebhookSettings>({...})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  
  // 业务逻辑
  const loadSettings = useCallback(async () => {
    // 加载逻辑
  }, [])
  
  const saveSettings = useCallback(async () => {
    // 保存逻辑
  }, [webhookSettings])
  
  const resetToDefaults = useCallback(() => {
    // 重置逻辑
  }, [])
  
  // 返回需要的数据和方法
  return {
    webhookSettings,
    isLoading,
    isSaving,
    saveMessage,
    loadSettings,
    saveSettings,
    resetToDefaults,
    handleWebhookChange: (type: keyof WebhookSettings, value: string) => {
      setWebhookSettings(prev => ({ ...prev, [type]: value }))
    }
  }
}

// 工具类 hooks：use + 功能名称
export const useWebhookTest = () => {
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null)
  
  const testWebhook = useCallback(async (type: keyof WebhookSettings, url: string) => {
    // 测试逻辑
  }, [])
  
  return { testWebhook, testingWebhook }
}
```

### Hook 职责分离
```typescript
// ✅ 单一职责的 hooks
export const useSettingsStorage = () => {
  // 只负责存储相关逻辑
}

export const useWebhookValidation = () => {
  // 只负责验证相关逻辑
}

export const useWebhookNotification = () => {
  // 只负责通知相关逻辑
}
```

## 函数拆分规范

### 大函数拆分示例
```typescript
// ❌ 不好的做法：大函数
const testWebhook = async (type: keyof WebhookSettings) => {
  const url = webhookSettings[type]
  if (!url) {
    alert('请先输入 webhook URL')
    return
  }

  setTestingWebhook(type)
  
  try {
    const testMessage = `🧪 测试消息 - ${new Date().toLocaleString('zh-CN')}\n这是来自 Portfolio Lens 的测试通知`
    
    // 检查是否包含 {{MSG}} 变量
    let requestData = null
    let requestUrl = url
    let requestMethod = 'POST'
    
    if (url.includes('{{MSG}}')) {
      // 替换 {{MSG}} 变量
      requestUrl = url.replace(/{{MSG}}/g, encodeURIComponent(testMessage))
      requestMethod = 'GET'
      console.log('Using GET request with URL:', requestUrl)
    } else {
      // 没有变量时使用 POST 请求
      requestData = {
        msg_type: 'text',
        content: { text: testMessage },
      }
      console.log('Using POST request with data:', requestData)
    }
    
    console.log('Sending test webhook request:', {
      type: 'TEST_WEBHOOK',
      url: requestUrl,
      method: requestMethod,
      data: requestData
    })
    
    // 使用 background script 来发送请求，避免 CORS 问题
    const response = await chrome.runtime.sendMessage({
      type: 'TEST_WEBHOOK',
      url: requestUrl,
      data: requestData,
      method: requestMethod
    })

    console.log('Test webhook response:', response)

    if (response && response.success) {
      alert('测试消息发送成功！')
    } else {
      const errorMsg = response?.error || '未知错误'
      console.error('Test webhook failed:', errorMsg)
      alert(`测试失败: ${errorMsg}`)
    }
  } catch (error) {
    console.error('测试 webhook 失败:', error)
    alert(`测试失败: ${error instanceof Error ? error.message : '未知错误'}`)
  } finally {
    setTestingWebhook(null)
  }
}

// ✅ 好的做法：拆分后的小函数
const createTestMessage = () => {
  return `🧪 测试消息 - ${new Date().toLocaleString('zh-CN')}\n这是来自 Portfolio Lens 的测试通知`
}

const prepareWebhookRequest = (url: string, message: string) => {
  if (url.includes('{{MSG}}')) {
    return {
      url: url.replace(/{{MSG}}/g, encodeURIComponent(message)),
      method: 'GET' as const,
      data: null
    }
  }
  
  return {
    url,
    method: 'POST' as const,
    data: {
      msg_type: 'text',
      content: { text: message }
    }
  }
}

const sendWebhookRequest = async (requestConfig: ReturnType<typeof prepareWebhookRequest>) => {
  return await chrome.runtime.sendMessage({
    type: 'TEST_WEBHOOK',
    ...requestConfig
  })
}

const handleWebhookResponse = (response: any) => {
  if (response && response.success) {
    alert('测试消息发送成功！')
  } else {
    const errorMsg = response?.error || '未知错误'
    console.error('Test webhook failed:', errorMsg)
    alert(`测试失败: ${errorMsg}`)
  }
}

const testWebhook = async (type: keyof WebhookSettings) => {
  const url = webhookSettings[type]
  if (!url) {
    alert('请先输入 webhook URL')
    return
  }

  setTestingWebhook(type)
  
  try {
    const testMessage = createTestMessage()
    const requestConfig = prepareWebhookRequest(url, testMessage)
    const response = await sendWebhookRequest(requestConfig)
    handleWebhookResponse(response)
  } catch (error) {
    console.error('测试 webhook 失败:', error)
    alert(`测试失败: ${error instanceof Error ? error.message : '未知错误'}`)
  } finally {
    setTestingWebhook(null)
  }
}
```

## 文件组织规范

### 组件文件结构
```
src/newtab/components/
├── settings/
│   ├── index.tsx              # 主组件
│   ├── hooks/
│   │   ├── useWebhookSettings.ts
│   │   ├── useWebhookTest.ts
│   │   └── useSettingsStorage.ts
│   ├── components/
│   │   ├── SettingsHeader.tsx
│   │   ├── WebhookSettingsForm.tsx
│   │   ├── WebhookTestSection.tsx
│   │   ├── SettingsInstructions.tsx
│   │   └── OtherSettings.tsx
│   └── utils/
│       ├── webhookUtils.ts
│       └── validationUtils.ts
```

### Hook 文件结构
```typescript
// hooks/useWebhookSettings.ts
import { useState, useCallback, useEffect } from 'react'
import { WebhookSettings } from '../types'

export const useWebhookSettings = () => {
  // 状态定义
  const [webhookSettings, setWebhookSettings] = useState<WebhookSettings>({
    position: '',
    funding: '',
    fundingSummary: '',
    price: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // 业务逻辑
  const loadSettings = useCallback(async () => {
    // 加载逻辑
  }, [])

  const saveSettings = useCallback(async () => {
    // 保存逻辑
  }, [webhookSettings])

  // 副作用
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // 返回值
  return {
    webhookSettings,
    isLoading,
    isSaving,
    saveMessage,
    loadSettings,
    saveSettings,
    handleWebhookChange: (type: keyof WebhookSettings, value: string) => {
      setWebhookSettings(prev => ({ ...prev, [type]: value }))
    }
  }
}
```

## 类型定义规范

### 接口定义
```typescript
// types/webhook.ts
export interface WebhookSettings {
  position: string
  funding: string
  fundingSummary: string
  price: string
}

export interface WebhookRequest {
  url: string
  method: 'GET' | 'POST'
  data?: any
}

export interface WebhookResponse {
  success: boolean
  error?: string
}
```

## 工具函数规范

### 纯函数优先
```typescript
// utils/webhookUtils.ts
export const createTestMessage = (): string => {
  return `🧪 测试消息 - ${new Date().toLocaleString('zh-CN')}\n这是来自 Portfolio Lens 的测试通知`
}

export const prepareWebhookRequest = (url: string, message: string): WebhookRequest => {
  if (url.includes('{{MSG}}')) {
    return {
      url: url.replace(/{{MSG}}/g, encodeURIComponent(message)),
      method: 'GET',
      data: null
    }
  }
  
  return {
    url,
    method: 'POST',
    data: {
      msg_type: 'text',
      content: { text: message }
    }
  }
}

export const validateWebhookUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
```

## 代码审查清单

### 组件审查
- [ ] 组件行数是否超过 60 行？
- [ ] 是否包含与渲染无关的业务逻辑？
- [ ] 是否使用了自定义 hooks 处理业务逻辑？
- [ ] 组件职责是否单一？

### 函数审查
- [ ] 函数行数是否超过 60 行？
- [ ] 是否可以将大函数拆分为小函数？
- [ ] 函数是否职责单一？
- [ ] 是否使用了纯函数？

### Hook 审查
- [ ] Hook 是否职责单一？
- [ ] 是否返回了组件需要的所有数据？
- [ ] 是否处理了错误状态？
- [ ] 是否使用了适当的依赖项？

### 类型审查
- [ ] 是否定义了明确的类型？
- [ ] 是否使用了 TypeScript 的类型检查？
- [ ] 接口是否简洁明了？

## 单元测试规范

### 测试范围
- **非渲染逻辑优先**：对于计算函数、控制函数等非渲染逻辑，有必要的应该编写单元测试
- **纯函数测试**：所有纯函数都应该有对应的单元测试
- **工具函数测试**：数据处理、格式转换等工具函数需要测试覆盖
- **Hook 逻辑测试**：自定义 hooks 中的业务逻辑应该进行测试

### 测试文件组织
```
src/
├── utils/
│   ├── webhookUtils.ts
│   └── webhookUtils.test.ts
├── hooks/
│   ├── useWebhookSettings.ts
│   └── useWebhookSettings.test.ts
└── components/
    └── settings/
        ├── components/
        │   ├── WebhookSettingsForm.tsx
        │   └── WebhookSettingsForm.test.tsx
```

### 测试示例
```typescript
// utils/webhookUtils.test.ts
import { createTestMessage, prepareWebhookRequest, validateWebhookUrl } from './webhookUtils'

describe('webhookUtils', () => {
  describe('createTestMessage', () => {
    it('应该返回正确格式的测试消息', () => {
      const message = createTestMessage()
      expect(message).toMatch(/🧪 测试消息 - .*\n这是来自 Portfolio Lens 的测试通知/)
    })
  })

  describe('prepareWebhookRequest', () => {
    it('应该正确处理包含 {{MSG}} 变量的 URL', () => {
      const url = 'https://example.com/webhook?msg={{MSG}}'
      const message = 'test message'
      const result = prepareWebhookRequest(url, message)
      
      expect(result.method).toBe('GET')
      expect(result.url).toContain(encodeURIComponent(message))
      expect(result.data).toBeNull()
    })

    it('应该正确处理不包含变量的 URL', () => {
      const url = 'https://example.com/webhook'
      const message = 'test message'
      const result = prepareWebhookRequest(url, message)
      
      expect(result.method).toBe('POST')
      expect(result.url).toBe(url)
      expect(result.data).toEqual({
        msg_type: 'text',
        content: { text: message }
      })
    })
  })

  describe('validateWebhookUrl', () => {
    it('应该验证有效的 URL', () => {
      expect(validateWebhookUrl('https://example.com/webhook')).toBe(true)
      expect(validateWebhookUrl('http://localhost:3000/webhook')).toBe(true)
    })

    it('应该拒绝无效的 URL', () => {
      expect(validateWebhookUrl('invalid-url')).toBe(false)
      expect(validateWebhookUrl('')).toBe(false)
    })
  })
})
```

### Hook 测试示例
```typescript
// hooks/useWebhookSettings.test.ts
import { renderHook, act } from '@testing-library/react'
import { useWebhookSettings } from './useWebhookSettings'

describe('useWebhookSettings', () => {
  it('应该正确初始化状态', () => {
    const { result } = renderHook(() => useWebhookSettings())
    
    expect(result.current.webhookSettings).toEqual({
      position: '',
      funding: '',
      fundingSummary: '',
      price: ''
    })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isSaving).toBe(false)
  })

  it('应该正确处理 webhook 设置变更', () => {
    const { result } = renderHook(() => useWebhookSettings())
    
    act(() => {
      result.current.handleWebhookChange('position', 'https://example.com/position')
    })
    
    expect(result.current.webhookSettings.position).toBe('https://example.com/position')
  })
})
```

### 测试运行规范
- **修改前运行测试**：在修改任何代码之前，先运行相关测试确保现有功能正常
- **修改后运行测试**：修改代码后，运行测试确保新功能正确且没有破坏现有功能
- **持续集成**：在 CI/CD 流程中自动运行测试
- **测试覆盖率**：对于核心业务逻辑，测试覆盖率应该达到 80% 以上

### 测试最佳实践
1. **测试命名**：使用描述性的测试名称，清楚说明测试的目的
2. **测试隔离**：每个测试应该独立运行，不依赖其他测试的状态
3. **边界测试**：测试边界条件和异常情况
4. **Mock 外部依赖**：对于网络请求、文件系统等外部依赖，使用 mock 进行测试
5. **测试数据**：使用固定的测试数据，避免随机性

## 最佳实践总结

1. **组件只负责渲染**：将业务逻辑抽离到自定义 hooks
2. **函数长度限制**：严格控制在 60 行以内
3. **单一职责**：每个函数和组件只负责一个功能
4. **类型安全**：充分利用 TypeScript 的类型系统
5. **可读性优先**：代码应该易于理解和维护
6. **纯函数优先**：尽可能使用纯函数处理数据转换
7. **错误处理**：适当的错误处理和用户反馈
8. **性能优化**：合理使用 useCallback、useMemo 等优化手段
9. **单元测试**：对非渲染逻辑编写单元测试，确保代码质量和稳定性

遵循这些规范可以确保代码的可维护性、可读性和可扩展性。 