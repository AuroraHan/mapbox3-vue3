//添加建筑物
const addBuilding = async () => {
    const tilesetBuild = await Cesium.createOsmBuildingsAsync()
    cesiumV.scene.primitives.add(tilesetBuild)
}