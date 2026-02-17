import { useState } from "react";

const data = [
  { label: "Pending", value: 23, color: "#F5A623" },
  { label: "Accepted", value: 41, color: "#3EC9A7" },
  { label: "Orders", value: 67, color: "#4E7EF7" },
  { label: "Rejected", value: 12, color: "#E05252" },
];

const total = data.reduce((sum, d) => sum + d.value, 0);

function buildDonutSegments(items, cx, cy, r, innerR) {
  let cumulative = 0;
  const gap = 0.018; // gap in radians between segments

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

export default function EstimateStatusChart() {
  const [hovered, setHovered] = useState(null);

  const cx = 110;
  const cy = 110;
  const outerR = 88;
  const innerR = 54;

  const segments = buildDonutSegments(data, cx, cy, outerR, innerR);

  const active = hovered !== null ? data[hovered] : null;

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
            const scale = isHovered ? 1.06 : 1;
            const midX = cx + (outerR + innerR) / 2 * Math.cos(seg.midAngle);
            const midY = cy + (outerR + innerR) / 2 * Math.sin(seg.midAngle);
            const tx = cx + (midX - cx) * (scale - 1);
            const ty = cy + (midY - cy) * (scale - 1);

            return (
              <g
                key={seg.label}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  cursor: "pointer",
                  transform: isHovered
                    ? `translate(${tx}px, ${ty}px) scale(${scale})`
                    : "translate(0,0) scale(1)",
                  transformOrigin: `${cx}px ${cy}px`,
                  transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                <path
                  d={seg.d}
                  fill={seg.color}
                  style={{
                    filter: isHovered ? `drop-shadow(0 4px 12px ${seg.color}55)` : "none",
                    transition: "filter 0.2s ease",
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
                  {total}
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
        {data.map((item, i) => (
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
              background: hovered === i ? `${item.color}12` : "transparent",
              transition: "background 0.15s ease",
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
                transition: "box-shadow 0.15s ease",
              }}
            />
            <span
              style={{
                fontSize: "12.5px",
                color: hovered === i ? "#1a1d23" : "#6b7280",
                fontWeight: hovered === i ? 600 : 400,
                transition: "color 0.15s, font-weight 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}{" "}
              <span style={{ color: hovered === i ? item.color : "#9ba3b4", fontWeight: 500 }}>
                ({item.value})
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}