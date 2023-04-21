var app = new Vue({
  el: "#app",
  // storing the state of the page
  data: {
    connected: false,
    ros: null,
    ws_address: "ws://localhost:9090",
    greeting: "Hello Robot!",
    logs: [],
    topic: null,
    message: null,
    lin: 1,
    ang: 2,
  },
  // helper methods to connect to ROS
  methods: {
    connect: function () {
      this.logs.unshift("connect to rosbridge server ......");
      this.ros = new ROSLIB.Ros({
        url: this.ws_address,
      });
      this.ros.on("connection", () => {
        this.connected = true;
        this.logs.unshift("Connected!");
        console.log('Connected!')
      });
      this.ros.on("error", (error) => {
        this.logs.unshift("Error connecting to websocket server");
        // console.log('Error connecting to websocket server: ', error)
      });
      this.ros.on("close", () => {
        this.connected = false;
        this.logs.unshift("Connection to websocker server closed");
        // console.log('Connection to websocket server closed.')
      });
    },
    disconnect: function () {
      this.ros.close();
    },

    setTopic_cmdvel: function() {
      this.topic = new ROSLIB.Topic({
        ros: this.ros,
        name: "/turtle1/cmd_vel",
        messageType: "geometry_msgs/Twist",
      });
    },

    setTopic_pose: function() {
      this.topic = new ROSLIB.Topic({
        ros: this.ros,
        name: "/turtle1/pose",
        messageType: "turtlesim/Pose",
      });
    },

    // move function
    move: function() {
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
        },
      });
      this.setTopic_cmdvel();
      this.topic.publish(twist);
    },

    // subscribe msg function
    

  },
});
