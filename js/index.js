(function () {
  var scene, renderer, camera, navTool;
  const center = [121.540514, 25.013778];
  var MAT_BUILDING;
  var iR;
  const api = '../geo/export.geojson';
  Awake();

  // When user resize window
  window.addEventListener('resize', onWindowResize, false);

  function onWindowResize() {
    if (scene) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  onWindowResize();

  function Awake() {
    // init scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    // init camera
    camera = new THREE.PerspectiveCamera(
      25, window.clientWidth / window.clientHeight, 1, 100);
    camera.position.set(8, 4, 0);

    // Init group
    iR = new THREE.Group();
    iR.name = "Interactive Root";
    scene.add(iR);

    // init light
    let light0 = new THREE.AmbientLight(0xfafafa, 0.25);
    let light1 = new THREE.AmbientLight(0xfafafa, 0.4);
    light1.position.set(200, 90, 40);
    let light2 = new THREE.AmbientLight(0xfafafa, 0.4);
    light2.position.set(200, 90, -40);

    scene.add(light0);
    scene.add(light1);
    scene.add(light2);
    
    let gridHelper = new THREE.GridHelper(60, 160, new THREE.Color(0x555555), new THREE.Color(0x333333));
    scene.add(gridHelper);

    // init renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // init controls
    navTool = new THREE.OrbitControls(camera, renderer.domElement);
    navTool.enableDamping = true;
    navTool.dampingFactor = 0.25;
    navTool.screenSpacePanning = false;
    navTool.maxDistance = 800;

    navTool.update();

    Update();
    MAT_BUILDING = new THREE.MeshPhongMaterial();
    GetGeoJson();
  }

  function Update() {
    requestAnimationFrame(Update);
    renderer.render(scene, camera);

  }

  function GetGeoJson() {
    fetch(api).then((res) => {
      res.json().then((data) => {
        // console.log(data);
        LoadBuildings(data);

      })
    })
  }

  function LoadBuildings(data) {
    let features = data.features;
    for (let i = 0; i < features.length; i++) {
      let fel = features[i];
      if (!fel['properties']) return;
      if (fel.properties['building']) {
        addBuilding(fel.geometry.coordinates, fel.properties, fel.properties["building:levels"]);
      }
    }
  }

  function addBuilding(data, info, height = 1) {
    height = height ? height : 1;
    for (let i = 0; i < data.length; i++) {
      let el = data[i];
      let shape = genShape(el, center);
      let geometry = genGeometry(shape, { curveSegments: 1, depth: 0.05 * height, bevelEnabled: false });
      geometry.rotateX(Math.PI / 2);
      geometry.rotateZ(Math.PI);
      geometry.rotateY(Math.PI);
      let mesh = new THREE.Mesh(geometry, MAT_BUILDING);
      scene.add(mesh);
    }
  }

  function genShape(points, center) {
    let shape = new THREE.Shape();
    for (let i = 0; i < points.length; i++) {
      let elp = points[i];
      elp = GPSRelativePosition(elp, center);
      if (i == 0) {
        shape.moveTo(elp[0], elp[1]);
      } else {
        shape.lineTo(elp[0], elp[1]);
      }
    }

    return shape;
  }

  function genGeometry(shape, settings) {
    let geometry = new THREE.ExtrudeBufferGeometry(shape, settings);
    geometry.computeBoundingBox();

    return geometry;
  }

  function GPSRelativePosition(objPosi, centerPosi) {
    // Get GPS distance

    let dis = window.geolib.getDistance(objPosi, centerPosi);
    // Get bearing angle
    let bearing = window.geolib.getRhumbLineBearing(objPosi, centerPosi);
    // Calculate X by centerPosi.x + distance * cos(rad)
    let x = centerPosi[0] + (dis * Math.cos(bearing * Math.PI / 180));
    // Calculate Y by centerPosi.y + distance * sin(rad)
    let y = centerPosi[1] + (dis * Math.sin(bearing * Math.PI / 180));
    // Reverse X (it work) 
    return [-x / 100, y / 100];
  }
})();