var app = new Vue({
  el: '#app',
  // storing the state of the page
  data: {
    connected: false,
    ros: null,
    ws_address: 'ws://localhost:9090',
    greeting: 'Hello',
    logs: [],
    // topic: null,
    // message: null,
    lin: 1,
    ang: 2,
    info: null,
    // cameraViewer: null,
    // viewer: null,
    // gridClient: null,
  },

  // // axios api get request
  // mounted () {
  //   axios
  //     .get('https://api.coindesk.com/v1/bpi/currentprice.json')
  //     // .then(response =>  console.log(response))
  //     .then(response => (this.info = response.data.bpi))
  //     .catch(error => console.log(error))
  // },

  // helper methods to connect to ROS
  methods: {
    connect: function () {
      this.logs.unshift('connect to rosbridge server ......');
      this.ros = new ROSLIB.Ros({
        url: this.ws_address,
      });
      this.ros.on('connection', () => {
        this.connected = true;
        this.logs.unshift('Connected!');
        this.setCamera();
        // this.setROS3d();
        this.URDF_Viewer();
        console.log('Connected!');
      });
      this.ros.on('error', (error) => {
        this.logs.unshift('Error connecting to websocket server');
        // console.log('Error connecting to websocket server: ', error)
      });
      this.ros.on('close', () => {
        this.connected = false;
        this.logs.unshift('Connection to websocker server closed');
        // console.log('Connection to websocket server closed.')
      });
    },
    disconnect: function () {
      this.ros.close();
    },

    setTopic_cmdvel: function () {
      this.cmd_pub = new ROSLIB.Topic({
        ros: this.ros,
        name: '/cmd_vel',
        messageType: 'geometry_msgs/msg/Twist',
      });
    },

    setTopic_pose: function () {
      this.pose_sub = new ROSLIB.Topic({
        ros: this.ros,
        name: '/turtle1/pose',
        messageType: 'turtlesim/Pose',
      });
    },

    // move function
    move: function () {
      let twist = new ROSLIB.Message({
        linear: {
          x: this.lin,
          y: 0,
          z: 0,
        },
        angular: {
          x: 0,
          y: 0,
          z: this.ang,
        }
      });
      this.setTopic_cmdvel();
      this.cmd_pub.publish(twist);
    },

    // SUBSCRIBE msg function

    // SERVICE call
    // create service
    reset: function () {
      this.reset_call = new ROSLIB.Service({
        ros: this.ros,
        name: '/reset',
        serviceType: 'std_srvs/Empty',
      });
      this.logs.unshift('calling ' + this.reset_call.name + '...');

      // create service request
      this.reset_req = new ROSLIB.ServiceRequest({});
      // call service with the given request
      this.reset_call.callService(this.reset_req, function () {});
      this.logs.unshift('calling ' + this.reset_call.name + ' completed!');
    },

    //spwan a new turtle
    spawn: function () {
      this.spawn_call = new ROSLIB.Service({
        ros: this.ros,
        name: '/spawn',
        serviceType: 'turtlesim/Spawn',
      });
      // create service request
      this.spawn_req = new ROSLIB.ServiceRequest({
        x: Math.floor(Math.random() * 10),
        y: Math.floor(Math.random() * 10),
        theta: 0,
        name: '',
      });
      // call service with the given request
      this.spawn_call.callService(this.spawn_req, function () {});
    },

    //exec python code from web button
    exec_py: function () {
      const path = 'http://127.0.0.1:5000/exec/';
      axios
        .get(path)
        .then((response) => {
          console.log(response.data);
          this.greeting = response.data;
        })
        .catch((error) => {
          console.log(error);
        });
    },

    // Streaming robot’s camera
    setCamera: function () {
      console.log('set camera method');
      this.cameraViewer = new MJPEGCANVAS.MultiStreamViewer({
        divID: 'mjpeg',
        // host: 'localhost',
        host: '172.26.11.245', //web_video_server's IP
        width: 640,
        height: 480,
        topics: ['/camera/image_raw', '/camera/image_raw/compressed'],
        labels: ['Camera view', 'Camera view Compressed'],
        port: 8080,
      });
    },

    setROS3d: function () {
      console.log('set 3d Viewer');
      this.viewer = new ROS3D.Viewer({
        divID : 'map',
        width : 640,
        height : 480,
        antialias : true
      });
      
      this.gridClient = new ROS3D.OccupancyGridClient({
        ros: this.ros,
        rootObject: this.viewer.scene,
      });

      // this.gridClient.on('change', function () {
      //   this.viewer.scaleToDimensions(this.gridClient.currentGrid.width, this.gridClient.currentGrid.height);
      //   // this.viewer.shift(3.1, 2.9);
      //   // this.viewer.shift(gridClient.currentGrid.pose.position.x, gridClient.currentGrid.pose.position.y);
      // });
    },


    // URDF Loader
    URDF_Viewer: function () {
      console.log('start URDF Viewer')
      this.urdf_viewer = new ROS3D.Viewer({
        divID: 'urdf',
        width : 800,
        height : 600,
        antialias : true
      });

      // Add a grid
      this.urdf_viewer.addObject(new ROS3D.Grid());

      // Setup a client to listen to TFs
      this.tfClient = new ROSLIB.TFClient ({
        ros: this.ros,
        angularThres : 0.01,
        transThres : 0.01,
        rate : 10.0
      });

      // Setup the URDF client.
      this.urdfClient = new ROS3D.UrdfClient({
        ros : this.ros,
        tfClient : this.tfClient,
        path : 'https://ros-web-controller.s3.ap-northeast-1.amazonaws.com/ur_description/',
        rootObject : this.urdf_viewer.scene,
        loader : ROS3D.COLLADA_LOADER_2
      });
    }

    // set param

    // 2d 3d model visualization
  },
});
