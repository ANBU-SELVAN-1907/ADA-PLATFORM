from docx.shared import Pt, RGBColor

# =====================================================================
# DELOITTE CORE AI - EXECUTIVE DESIGN SYSTEM CONFIGURATION TEMPLATE
# =====================================================================

# 1. THEME DESIGN PALETTE CONSTANTS (Deloitte Corporate Brand Alignment)
COLOR_PRIMARY = RGBColor(134, 188, 36)     # Deloitte Green (#86BC24)
COLOR_SECONDARY = RGBColor(30, 30, 30)     # Deep Slate / Dark Charcoal Accent
COLOR_TEXT = RGBColor(55, 55, 55)          # High-Contrast Technical Body Text
COLOR_MUTED = RGBColor(120, 120, 120)      # System Metadata Tracking Tint

HEX_PRIMARY = "86BC24"
HEX_SECONDARY = "1E1E1E"
HEX_LIGHT_BG = "F7F9F5"
HEX_CALLOUT_BG = "FAFCF8"
HEX_BORDER = "CCCCCC"
HEX_ALERT_RED = "D32F2F"

# 2. STRATEGIC EXECUTIVE TYPOGRAPHY
FONT_FAMILY = "Arial"
CODE_FONT_FAMILY = "Consolas"

FONT_SIZES = {
    "title": Pt(16),
    "subtitle": Pt(10),
    "heading_1": Pt(12),
    "heading_2": Pt(11),
    "body": Pt(9.5),
    "table_hdr": Pt(9.5),
    "table_body": Pt(9),
    "footer": Pt(8),
    "ascii_graphic": Pt(8.5)
}

# 3. AUTO-FIT CELL PADDING & LAYOUT SPACING (In DXA)
SPACING = {
    "margin_inches": 1.0,
    "table_top": 90,
    "table_bottom": 90,
    "table_left": 120,
    "table_right": 120
}
PADDING = SPACING

# 4. STRUCTURED LAYOUT CONSTANTS
LIST_BULLET_TOKEN = "\u2022 "
FOOTER_TEXT = "2026 Deloitte Development LLC. Confidential and Proprietary."

# 5. ENTERPRISE CORE AI LAYERED SCHEMA GRAPH VISUALIZATION
TELEMETRY_GRAPHIC = [
    "  +-----------------------------------------------------------------+",
    "  |                          Ingress Layer                          |",
    "  +-----------------------------------------------------------------+",
    "                                  |    ",
    "                                  v    ",
    "  +-----------------------------------------------------------------+",
    "  |                        Controllers/APIs                         |",
    "  +-----------------------------------------------------------------+",
    "                                  |    ",
    "                                  v    ",
    "  +-----------------------------------------------------------------+",
    "  |                    Domain Processing Layer                      |",
    "  +-----------------------------------------------------------------+",
    "                                  |    ",
    "                                  v    ",
    "  +-----------------------------------------------------------------+",
    "  |                     Services & Core Logic                       |",
    "  +-----------------------------------------------------------------+",
    "                                  |    ",
    "                                  v    ",
    "  +-----------------------------------------------------------------+",
    "  |                    Data Persistence Layer                       |",
    "  +-----------------------------------------------------------------+",
    "                                  |    ",
    "                                  v    ",
    "  +-----------------------------------------------------------------+",
    "  |                     Repositories/Storage                        |",
    "  +-----------------------------------------------------------------+"
]