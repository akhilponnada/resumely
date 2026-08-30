import { ImageResponse } from "next/og";

export const alt = "Resumely — Stop searching. Get matched.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#F4F6F5",
                    color: "#171A1C",
                    padding: 72,
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", maxWidth: 700 }}>
                    <div style={{ display: "flex", fontSize: 24, opacity: 0.55 }}>Resumely</div>
                    <div
                        style={{
                            display: "flex",
                            fontSize: 64,
                            lineHeight: 1.1,
                            marginTop: 20,
                            fontWeight: 500,
                        }}
                    >
                        Stop searching. Get matched.
                    </div>
                    <div style={{ display: "flex", marginTop: 24, fontSize: 24, opacity: 0.6 }}>
                        Live roles. Ranked against your resume.
                    </div>
                </div>
                <div
                    style={{
                        display: "flex",
                        fontSize: 128,
                        fontFamily: "ui-monospace, SFMono-Regular, monospace",
                    }}
                >
                    87%
                </div>
            </div>
        ),
        { ...size }
    );
}
