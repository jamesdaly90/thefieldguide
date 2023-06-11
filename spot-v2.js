/* Login */
document.getElementById('login-button').addEventListener('click', function(event) {
    event.preventDefault();
    const xano_input = {
        email: document.getElementById('login-email-input').value,
        password: document.getElementById('login-password-input').value
    };
    fetch("https://x8ki-letl-twmt.n7.xano.io/api:FaycGcla/auth/login", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(xano_input),
    })
    .then(res => res.json())
    .then(json => {
        const xanoResponse = json;
        const hasKey = Object.keys(xanoResponse).includes("authToken");
        if (hasKey === false) {
            alert("Invalid username or password.")
        } else {
            const authToken = xanoResponse.authToken;
            localStorage.setItem('AuthToken', authToken);
            setTimeout(() => location.href = "/", 2000);
        }
    });
});

/* Get User Data, Add Username to Nav, Add Profile Picture to Nav, and Hide/Show Nav Elements */
function GetUserData() {
    const authToken = localStorage.getItem('AuthToken');
    return fetch("https://x8ki-letl-twmt.n7.xano.io/api:FaycGcla/auth/me", {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        }
    })
    .then(res => res.json())
    .then(json => {
        const xanoResponse = json;
        document.getElementById('nav-username').textContent = xanoResponse.username;

        const profilePicUrl = xanoResponse.profile_picture.url;
        console.log("Profile picture URL:", profilePicUrl);

        const profilePicElement = document.getElementById('nav-profile-picture');
        console.log("Profile picture element before setting src:", profilePicElement);

        profilePicElement.src = profilePicUrl;
        profilePicElement.srcset = "";  // Clear srcset

        console.log("Profile picture element after setting src:", profilePicElement);
        
        // User is logged in, so hide login and signup buttons, show user-container
        document.getElementById('nav-login-button').style.display = 'none';
        document.getElementById('nav-signup-button').style.display = 'none';
        document.getElementById('user-container').style.display = 'block';
        // Return the user data
        return json;
    })
}

window.onload = function() {
    if (localStorage.getItem('AuthToken') == null) { 
        // User is not logged in, so show login and signup buttons, hide user-container
        document.getElementById('nav-login-button').style.display = 'block';
        document.getElementById('nav-signup-button').style.display = 'block';
        document.getElementById('user-container').style.display = 'none';
    } else {
        GetUserData();
    }
}

/* Logout  */
document.getElementById('user-container').addEventListener('click', function() {
    localStorage.removeItem('AuthToken');
    location.href = "/";
});




// Extract spot ID from URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const spotId = urlParams.get('id');

async function fetchSpot() {
  const response = await fetch(`https://x8ki-letl-twmt.n7.xano.io/api:FaycGcla/spots/${spotId}`);
  const spot = await response.json();
  displaySpot(spot);
}

function displaySpot(spot) {
  const spotImage = document.querySelector('#spot-image');
  const spotDescription = document.querySelector('#spot-description');

  // Select all elements with the data-spot-name attribute
  const spotNameElements = document.querySelectorAll('[data-spot-name]');

  // Update each element's content with the spot's name
  spotNameElements.forEach((element) => {
    element.textContent = spot.name;
  });

  spotImage.src = `https://x8ki-letl-twmt.n7.xano.io${spot.image.path}`;
  spotImage.removeAttribute('srcset'); // Remove srcset attribute

  // Split description into lines, then join them together with two <br /> tags
  const descriptionWithBreaks = spot.description.split('\\n').join('<br /><br />');

  // Set the description with line breaks
  spotDescription.innerHTML = descriptionWithBreaks;
}

async function fetchPhotos() {
  const response = await fetch(`https://x8ki-letl-twmt.n7.xano.io/api:FaycGcla/photos_filter?spots_id=${spotId}`);
  const photos = await response.json();
  displayPhotos(photos);
}

async function fetchComments() {
  const response = await fetch(`https://x8ki-letl-twmt.n7.xano.io/api:FaycGcla/spot_comment_filter?spot_id=${spotId}`);
  const comments = await response.json();
  
  // log the fetched comments to the console
  console.log(comments);
  
  // and then proceed with displaying the comments as before
  displayComments(comments);
}

document.addEventListener('DOMContentLoaded', function() {
  fetchSpot();
  fetchPhotos();
  fetchComments();
});

function displayPhotos(photos) {
  const gallery = document.querySelector('#inspo-gallery');
  const inspoTemplate = document.querySelector('.guide-spots_spot');

  photos.forEach((photo) => {
    const newInspo = inspoTemplate.cloneNode(true);

    const inspoImage = newInspo.querySelector('#inspo-image');
    if (photo.image && photo.image.path) {
      inspoImage.src = `https://x8ki-letl-twmt.n7.xano.io${photo.image.path}`;
    }
    inspoImage.removeAttribute('srcset'); // Remove srcset attribute

    gallery.appendChild(newInspo);
  });

  // Remove the original inspo template from the DOM
  inspoTemplate.remove();
}

function displayComments(comments) {
  const template = document.querySelector('.comment-template');
  template.style.display = 'none'; // Hide the template

  // Sort comments based on creation date in descending order (most recent first)
  comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Separate comments into parents and replies
  const parents = comments.filter(comment => comment.spot_comment_id === 0 || comment.spot_comment_id === null);
  const replies = comments.filter(comment => comment.spot_comment_id !== 0 && comment.spot_comment_id !== null);

  // Generate and append parent comments
  parents.forEach((parent) => {
    const parentElement = generateCommentElement(parent, false);
    document.querySelector('#comment-container').appendChild(parentElement);

    // Generate and append this parent's replies
    replies.filter(reply => reply.spot_comment_id === parent.id).forEach((reply) => {
      const replyElement = generateCommentElement(reply, true);
      parentElement.querySelector('.replies-container').appendChild(replyElement);
    });
  });
}

function generateCommentElement(comment, isReply) {
  const template = isReply ? document.querySelector('#reply-comment-template') : document.querySelector('.comment-template');
  const clone = template.cloneNode(true);

  if (isReply) {
    clone.querySelector('.comment-reply-content').textContent = comment.text;
  } else {
    clone.querySelector('.comment-content').textContent = comment.text;
  }

  // Add date to comment
  const commentDate = new Date(comment.created_at);
  clone.querySelector('#comment-date').textContent = commentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Add user data to comment
  if (comment.user) {
    clone.querySelector('#comment-user').textContent = comment.user.username;
    clone.querySelector('#comment-pfp').src = comment.user.profile_picture.url;
  }

  // Unhide the cloned comment template and set its display to flex
  clone.style.display = 'flex';

  if (!isReply) {
    const repliesContainer = document.createElement('div');
    repliesContainer.classList.add('replies-container');
    clone.querySelector('.spot_comment-ctas').after(repliesContainer);
  }

  return clone;
}

// Getting form element
let form = document.getElementById('wf-form-spot-comment-form');

// Getting spot_id from URL
let params = new URLSearchParams(window.location.search);
let spot_id = params.get('id');

// Adding an event listener for form submission
form.addEventListener('submit', async function(event) {
  // Preventing default form submission
  event.preventDefault();

  // Getting the input field value
  let text = document.getElementById('name').value;

  // Get current user data
  const currentUser = await GetUserData();

  // Making a POST request to the Xano API
  fetch('https://x8ki-letl-twmt.n7.xano.io/api:FaycGcla/spot_comment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
    spot_id: spot_id,
    text: text,
    user_id: currentUser.id, //assuming that the user object has an id property
    user_name: currentUser.username
}),
  })
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data);

    // Clear the input field
    document.getElementById('name').value = '';

    // Get current date
    let currentDate = new Date();
    let formattedDate = currentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    // Clone comment template and fill it with new data
    const newComment = generateCommentElement({
      created_at: currentDate,
      text: text,
      user: currentUser // Pass the entire user object instead
    }, false);
    const commentContainer = document.getElementById('comment-container');

    // Prepend the new comment to the comment section
    commentContainer.prepend(newComment);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
});
