# Read more about app structure at http://docs.appgyver.com

module.exports =

  rootView:
    location: "view-home#home"

  preloads: [
    {
      id: "form"
      location: "view-form#form"
    }
    {
      id: "settings"
      location: "view-settings#settings"
    }
  ]
  
  drawers:
    left:
      id: "progressDrawer"
      location: "drawer-progress#progress"
      showOnAppLoad: false
    options:
      animation: "parallax"
      centerViewInteractionMode: "None"
      closeGestures: ["TapCenterView"]
      openGestures: []
