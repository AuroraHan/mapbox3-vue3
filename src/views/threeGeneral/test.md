### 拖拽模型 老式方法

```js
const loadModel = async () => {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync("/models/aim-9_missile/scene.gltf");
  const model = gltf.scene;
  model.scale.set(100, 100, 100);
  scene.add(model);

  // --- 1️⃣ 计算模型包围盒 ---
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  // --- 2️⃣ 创建外层包裹 Mesh ---
  const wrapperGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const wrapperMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    wireframe: true,
    transparent: true,
    opacity: 0.3,
  });
  const wrapper = new THREE.Mesh(wrapperGeometry, wrapperMaterial);
  wrapper.position.copy(center);

  // --- 3️⃣ 调整模型，使其中心与外层 Mesh 对齐 ---
  model.position.sub(center);
  wrapper.add(model);

  scene.add(wrapper);
  objs.push(wrapper);

  dragModel();
};
const objs: Array<THREE.Object3D> = [];
let dragControls: DragControls;
let transformControls: TransformControls;
//拖拽模型
const dragModel = () => {
  transformControls = new TransformControls(camera, renderer.domElement);
  // transformControls.setMode('rotate')
  //特别注意
  scene.add(transformControls.getHelper());

  dragControls = new DragControls(objs, camera, renderer.domElement);
  //当开始拖拽时，禁用 OrbitControls
  dragControls.addEventListener("dragstart", function (event) {
    controls.enabled = false;
  });

  // 鼠标略过事件
  dragControls.addEventListener("hoveron", function (event) {
    // 让变换控件对象和选中的对象绑定
    transformControls.attach(event.object);
  });

  // 拖拽中

  dragControls.addEventListener("drag", function (event) {
    // event.object.position.y = Math.max(event.object.position.y, 0)
    controls.enabled = false;
  });

  // 拖拽结束后恢复 OrbitControls
  dragControls.addEventListener("dragend", function (event) {
    controls.enabled = true;
    transformControls.detach();
  });
};
```
