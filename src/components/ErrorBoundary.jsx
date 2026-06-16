import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    if (window.confirm("Are you sure you want to clear system state?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#0f172a",
          color: "#f8fafc",
          padding: "20px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center"
        }}>
          <div style={{
            maxWidth: "600px",
            background: "#1e293b",
            padding: "40px",
            borderRadius: "16px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
            border: "1.5px solid #ef4444"
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>⚠️</div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#f8fafc", margin: "0 0 10px 0" }}>
              เกิดข้อผิดพลาดในการโหลดหน้าจอ
            </h1>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "600", color: "#cbd5e1", margin: "0 0 20px 0" }}>
              Something went wrong / Screen rendering failed
            </h2>
            
            <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: "1.5", marginBottom: "30px" }}>
              พบข้อผิดพลาดขณะแสดงผลหน้าจอนี้ กรุณากดปุ่มเพื่อรีเฟรช หรือล้างข้อมูลแคชหากยังพบปัญหาเดิม
            </p>

            {this.state.error && (
              <div style={{
                textAlign: "left",
                background: "#0f172a",
                padding: "16px",
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "0.8rem",
                color: "#f87171",
                overflowX: "auto",
                marginBottom: "30px",
                border: "1px solid #334155",
                maxHeight: "150px"
              }}>
                <strong>Error:</strong> {this.state.error.toString()}
                {this.state.errorInfo && (
                  <pre style={{ margin: "8px 0 0 0", color: "#94a3b8" }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button 
                onClick={this.handleReload}
                style={{
                  background: "#0f766e",
                  border: "none",
                  color: "#ffffff",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "0.95rem"
                }}
              >
                🔄 รีเฟรชหน้าเว็บ / Reload Page
              </button>
              <button 
                onClick={this.handleReset}
                style={{
                  background: "transparent",
                  border: "1.5px solid #475569",
                  color: "#cbd5e1",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "0.95rem"
                }}
              >
                🗑️ รีเซ็ตระบบ / Reset State
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
