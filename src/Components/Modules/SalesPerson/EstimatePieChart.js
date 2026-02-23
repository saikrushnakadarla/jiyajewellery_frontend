import { useState } from "react";

function buildDonutSegments(items, cx, cy, r, innerR) {
  if (items.length === 0) return [];
  
  let cumulative = 0;
  const gap = 0.018; // gap in radians between segments
  const total = items.reduce((sum, d) => sum + d.value, 0);

  return items.map((item) => {
    const fraction = item.value / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2 + gap / 2;
    const endAngle = (cumulative + fraction) * 2 * Math.PI - Math.PI / 2 - gap / 2;
    cumulative += fraction;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle);
    const iy2 = cy + innerR * Math.sin(startAngle);

    const largeArc = fraction > 0.5 ? 1 : 0;

    const d = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      "Z",
    ].join(" ");

    const midAngle = startAngle + (endAngle - startAngle) / 2;

    return { ...item, d, midAngle };
  });
}

export default function EstimateStatusChart({ 
  pending = 0, 
  accepted = 0, 
  ordered = 0, 
  rejected = 0, 
  total = 0 
}) {
  const [hovered, setHovered] = useState(null);

  const data = [
    { label: "Pending", value: pending, color: "#F5A623" },
    { label: "Accepted", value: accepted, color: "#3EC9A7" },
    { label: "Orders", value: ordered, color: "#4E7EF7" },
    { label: "Rejected", value: rejected, color: "#E05252" },
  ];

  // Filter out zero values
  const filteredData = data.filter(item => item.value > 0);
  const chartTotal = filteredData.reduce((sum, d) => sum + d.value, 0);

  const cx = 110;
  const cy = 110;
  const outerR = 88;
  const innerR = 54;

  const segments = buildDonutSegments(filteredData, cx, cy, outerR, innerR);

  const active = hovered !== null ? filteredData[hovered] : null;

  // If no data, show empty state
  if (filteredData.length === 0) {
    return (
      <div
        style={{
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
          background: "#fff",
          borderRadius: "18px",
          boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
          padding: "28px 28px 22px",
          width: "280px",
          userSelect: "none",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "17px",
            fontWeight: 700,
            color: "#1a1d23",
            letterSpacing: "-0.2px",
          }}
        >
          Estimate Status
        </h2>
        <p
          style={{
            margin: "3px 0 20px",
            fontSize: "12.5px",
            color: "#9ba3b4",
          }}
        >
          Distribution by status
        </p>
        <div style={{ padding: "30px 0", color: "#9ba3b4" }}>
          No data available
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        background: "#fff",
        borderRadius: "18px",
        boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
        padding: "28px 28px 22px",
        width: "280px",
        userSelect: "none",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "17px",
            fontWeight: 700,
            color: "#1a1d23",
            letterSpacing: "-0.2px",
          }}
        >
          Estimate Status
        </h2>
        <p
          style={{
            margin: "3px 0 0",
            fontSize: "12.5px",
            color: "#9ba3b4",
            fontWeight: 400,
          }}
        >
          Distribution by status
        </p>
      </div>

      {/* Donut Chart */}
      <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
        <svg
          width={220}
          height={220}
          viewBox={`0 0 220 220`}
          style={{ overflow: "visible" }}
        >
          {segments.map((seg, i) => {
            const isHovered = hovered === i;

            return (
              <g
                key={seg.label}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
              >
                <path
                  d={seg.d}
                  fill={seg.color}
                  style={{
                    filter: isHovered 
                      ? `drop-shadow(0 4px 8px ${seg.color}80)` 
                      : `drop-shadow(0 2px 4px ${seg.color}40)`,
                    transition: "filter 0.25s ease, stroke 0.25s ease",
                    stroke: isHovered ? "#ffffff" : "transparent",
                    strokeWidth: isHovered ? "2px" : "0",
                  }}
                />
              </g>
            );
          })}

          {/* Center Label */}
          <g>
            {active ? (
              <>
                <text
                  x={cx}
                  y={cy - 9}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={active.color}
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    opacity: 1,
                    transition: "opacity 0.2s ease",
                  }}
                >
                  {active.label}
                </text>
                <text
                  x={cx}
                  y={cy + 13}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#1a1d23"
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "transform 0.2s ease",
                    transform: "scale(1)",
                  }}
                >
                  {active.value}
                </text>
              </>
            ) : (
              <>
                <text
                  x={cx}
                  y={cy - 9}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#9ba3b4"
                  style={{
                    fontSize: "12px",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "opacity 0.2s ease",
                  }}
                >
                  Total
                </text>
                <text
                  x={cx}
                  y={cy + 13}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#1a1d23"
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {chartTotal}
                </text>
              </>
            )}
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "9px 12px",
          marginTop: "18px",
        }}
      >
        {filteredData.map((item, i) => (
          <div
            key={item.label}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              cursor: "pointer",
              padding: "4px 6px",
              borderRadius: "7px",
              background: hovered === i ? `${item.color}15` : "transparent",
              transition: "background 0.2s ease, transform 0.2s ease",
              transform: hovered === i ? "translateX(4px)" : "translateX(0)",
            }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: item.color,
                flexShrink: 0,
                boxShadow: hovered === i ? `0 0 0 3px ${item.color}30` : "none",
                transition: "box-shadow 0.2s ease, transform 0.2s ease",
                transform: hovered === i ? "scale(1.1)" : "scale(1)",
              }}
            />
            <span
              style={{
                fontSize: "12.5px",
                color: hovered === i ? "#1a1d23" : "#6b7280",
                fontWeight: hovered === i ? 600 : 400,
                transition: "color 0.2s ease, font-weight 0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}{" "}
              <span style={{ 
                color: hovered === i ? item.color : "#9ba3b4", 
                fontWeight: 500,
                transition: "color 0.2s ease",
              }}>
                ({item.value})
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}