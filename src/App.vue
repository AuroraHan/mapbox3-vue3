<template>
  <div id="map">

  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import mapbox from 'mapbox-gl';

onMounted(() => {
  initMap()
})

const initMap = () => {
  mapbox.accessToken = "pk.eyJ1IjoiaHBqbmYiLCJhIjoiY20yMzU5OGhzMDI2NjJrb2kweG5yYWRuZSJ9.HX3dEC4HuYwKuA3_Fm2wXA";
  const map = new mapbox.Map({
    container: 'map',
    projection: "globe",
    // style: 'mapbox://styles/mapbox/outdoors-v12',
    style: {
      version: 8,
      sources: {
        m_mono: {
          type: "raster",
          tiles: ["/tile/google/{z}/{x}/{y}.jpg"],
          tileSize: 256,
          attribution: "",
        },
      },
      glyphs: "../../static/glyphs/{fontstack}/{range}.pbf",
      layers: [
        {
          id: "m_mono",
          type: "raster",
          source: "m_mono",
          minZoom: 0,
          maxZoom: 18,
        },
      ],
      fog: {
        range: [0.8, 8],
        color: '#e6ddec',
        "horizon-blend": 0.1
      }
    },
    center: [120, 30],
    zoom: 2,
  })
}


</script>

<style scoped>
#map {
  height: 100vh;
}
</style>
