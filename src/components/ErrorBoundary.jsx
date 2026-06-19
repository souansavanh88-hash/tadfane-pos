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
            width: "100%",
            background: "#1e293b",
            padding: "40px 32px",
            borderRadius: "16px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
            border: "1.5px solid #ef4444",
            boxSizing: "border-box"
          }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>⚠️</div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#f8fafc", margin: "0 0 8px 0" }}>
              ເກີດຂໍ້ຜິດພາດໃນການສະແດງຜົນ
            </h1>
            <h2 style={{ fontSize: "1.4rem", fontWeight: "700", color: "#f8fafc", margin: "0 0 8px 0" }}>
              เกิดข้อผิดพลาดในการแสดงผลหน้าจอ
            </h2>
            <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#cbd5e1", margin: "0 0 20px 0", fontStyle: "italic" }}>
              Something went wrong / Screen rendering failed
            </h3>
            
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: "1.6", marginBottom: "24px" }}>
              ພົບຂໍ້ຜິດພາດຂະນະສະແດງຜົນໜ້າຈໍນີ້ ກະລຸນາກົດປຸ່ມເພື່ອໂຫຼດຄືນໃໝ່ ຫຼື ລ້າງຂໍ້ມູນແຄຊຫາກຍັງພົບບັນຫາເດີມ<br />
              พบข้อผิดพลาดขณะแสดงผลหน้าจอนี้ กรุณากดปุ่มเพื่อรีเฟรช หรือล้างข้อมูลแคชหากยังพบปัญหาเดิม
            </p>

            {this.state.error && (
              <div style={{
                textAlign: "left",
                background: "#0f172a",
                padding: "16px",
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "0.75rem",
                color: "#f87171",
                overflowX: "auto",
                marginBottom: "24px",
                border: "1px solid #334155",
                maxHeight: "150px",
                boxSizing: "border-box",
                wordBreak: "break-all"
              }}>
                <strong>Error:</strong> {this.state.error.toString()}
                {this.state.errorInfo && (
                  <pre style={{ margin: "8px 0 0 0", color: "#94a3b8", fontFamily: "monospace" }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
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
                  fontSize: "0.9rem",
                  transition: "background 0.2s"
                }}
              >
                🔄 ໂຫຼດໃໝ່ / รีเฟรชหน้าเว็บ / Reload
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
                  fontSize: "0.9rem"
                }}
              >
                🗑️ ລ້າງຂໍ້ມູນ / รีเซ็ตระบบ / Clear Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
