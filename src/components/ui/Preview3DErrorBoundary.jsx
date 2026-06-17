import { Component } from 'react'

export default class Preview3DErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorMsg: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error?.message || String(error) }
  }

  componentDidCatch(error, info) {
    console.error('[3D Preview] Error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl text-sm"
          style={{ height: 430, background: '#f1f5f9', color: '#64748b' }}>
          <span>3D náhled není dostupný</span>
          {this.state.errorMsg && (
            <span className="text-xs px-4 text-center" style={{ color: '#94a3b8', maxWidth: 400 }}>
              {this.state.errorMsg}
            </span>
          )}
          <button
            onClick={() => this.setState({ hasError: false, errorMsg: '' })}
            className="px-4 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: '#2563eb', color: '#fff' }}>
            Zkusit znovu
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
