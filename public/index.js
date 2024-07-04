const socket = io("http://localhost:3000");

let roomId;
let localStream;
let peerConnection;

const configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] };

peerConnection = new RTCPeerConnection(configuration);

socket.on("offer", async ({ roomId, offer }) => {
    console.log('received offer:-', offer);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', { roomId: roomId, iceCanditate: event.candidate })
        }
    };

    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit('answer', { roomId: roomId, answer: answer });
})

socket.on("ice-candidate", async ({ roomId, iceCanditate }) => {
    console.log('iceCanditate from peer', iceCanditate);

    await peerConnection.addIceCandidate(iceCanditate);
})


async function joinRoom() {
    roomId = document.getElementById('roomId').value.trim();

    if (!roomId) {
        alert('Please enter a valid Room ID');
        return;
    }

    await streamWebCamVideo();
}

async function makeCall() {
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', { roomId: roomId, iceCanditate: event.candidate })
        }
    };

    var offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit('offer', { roomId: roomId, offer: offer });

    socket.on("answer", async ({ roomId, answer }) => {
        console.log('roomId', roomId)
        console.log('answer', answer)

        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    })

    peerConnection.addEventListener('connectionstatechange', event => {
        console.log('connection established')
    });
}

async function streamWebCamVideo() {
    try {
        // Get user media (video and audio)
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        // Display the stream in participant1 div
        const participant1 = document.getElementById('participant1');
        const videoElement = document.createElement('video');
        videoElement.srcObject = localStream;
        videoElement.autoplay = true;
        videoElement.muted = true; // Mute self-view
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        participant1.innerHTML = '';
        participant1.appendChild(videoElement);

        socket.emit('joinRoom', { roomId: roomId });

    } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Error accessing media devices. Please check your camera and microphone permissions.');
    }
}

peerConnection.addEventListener('track', async (event) => {
    const [remoteStream] = event.streams;

    // Display the stream in participant1 div
    const participant2 = document.getElementById('participant2');
    const videoElement = document.createElement('video');
    videoElement.srcObject = remoteStream;
    videoElement.autoplay = true;
    videoElement.muted = true; // Mute self-view
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';
    participant2.innerHTML = '';
    participant2.appendChild(videoElement);
})