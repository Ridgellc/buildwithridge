"""Draws the About page SVG shapes (hero topo lines, the Why Ridge mountain and trail) and writes them as JSON.
Run: python3 -I tools/ridge_shapes.py out.json, then paste the paths into about.html (.me-topo, .me-mtn)."""
import json, math, sys


def g(x, c, w, h):
    return h * math.exp(-((x - c) / w) ** 2)


# topo contour lines behind the hero (viewBox 1440 x 760)
def ridge(x):
    return g(x, 1080, 260, 1.0) + g(x, 760, 200, 0.55) + g(x, 1350, 160, 0.45)


topo = []
for i in range(11):
    base, amp = 760 - i * 46, 300 * (1 - i * 0.07)
    pts = [f"{x},{base - amp * ridge(x) + 10 * math.sin(x / 90 + i * 0.9):.1f}" for x in range(-20, 1461, 20)]
    topo.append("M" + " L".join(pts))


# mountain silhouette for Why Ridge (viewBox 1440 x 460)
def m(x):
    return g(x, 1030, 300, 330) + g(x, 560, 260, 150) + g(x, 1380, 170, 120) + 18 * math.sin(x / 47) * math.exp(-((x - 1030) / 500) ** 2)


def surf(x):
    return 460 - 40 - m(x)


mountain = "M0,460 L" + " L".join(f"{x},{surf(x):.1f}" for x in range(0, 1441, 12)) + " L1440,460 Z"
peak_x = max(range(0, 1441, 2), key=m)
peak_y = surf(peak_x)

# trail: switchbacks from the bottom left up to the summit, kept just under the surface
way = [(120, 440), (430, 405), (330, 372), (640, 330), (560, 292), (840, 236), (780, 196), (960, 150)]
pts = [(x, max(y, surf(x) + 12)) for x, y in way] + [(peak_x, peak_y + 4)]
# Catmull-Rom through the waypoints, so the switchbacks turn in smooth hairpins
ext = [pts[0]] + pts + [pts[-1]]
trail = f"M{pts[0][0]},{pts[0][1]:.1f}"
for i in range(1, len(ext) - 2):
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = ext[i - 1], ext[i], ext[i + 1], ext[i + 2]
    c1 = (x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6)
    c2 = (x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6)
    trail += f" C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {x2},{y2:.1f}"

json.dump({"topo": topo, "mountain": mountain, "trail": trail, "peak": [peak_x, round(peak_y, 1)]}, open(sys.argv[1], "w"))
print("peak", peak_x, round(peak_y, 1), "| trail points", len(pts))
