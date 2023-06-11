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
  
  // add a line here to add the user data to each comment
  comments.forEach(comment => {
    comment.user = comment._user;
    delete comment._user;  // delete the _user field now that we've copied its data to the user field
  });

  displayComments(comments);
}

document.addEventListener('DOMContentLoaded', async function() {
  fetchSpot();
  fetchPhotos();
  fetchComments();

  // Check if user is logged in
  if(localStorage.getItem('AuthToken') !== null) {
    // Fetch user data and set profile picture
    const currentUser = await GetUserData();

    // Check if user's profile picture is available
    if (currentUser.profile_picture && currentUser.profile_picture.url) {
      const profilePicElement = document.getElementById('new-comment-pfp');
      profilePicElement.src = currentUser.profile_picture.url;
      profilePicElement.srcset = "";  // Clear srcset
    }
  }
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

async function displayComments(comments) {
  const template = document.querySelector('.comment-template');
  template.style.display = 'none'; // Hide the template

  // Sort comments based on creation date in descending order (most recent first)
  comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Separate comments into parents and replies
  const parents = comments.filter(comment => comment.spot_comment_id === 0 || comment.spot_comment_id === null);
  const replies = comments.filter(comment => comment.spot_comment_id !== 0 && comment.spot_comment_id !== null);

  // Generate and append parent comments
  for (let parent of parents) {
    const parentElement = await generateCommentElement(parent, false);
    document.querySelector('#comment-container').appendChild(parentElement);

    // Generate and append this parent's replies
    for (let reply of replies.filter(reply => reply.spot_comment_id === parent.id)) {
      const replyElement = await generateCommentElement(reply, true);
      parentElement.querySelector('.replies-container').appendChild(replyElement);
    };
  };
}

async function generateCommentElement(comment, isReply) {
  const template = isReply ? document.querySelector('#reply-comment-template') : document.querySelector('.comment-template');
  const clone = template.cloneNode(true);

  // Assign comment id to the element for future reference
  clone.dataset.id = comment.id;

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

  // Check if the comment author is the same as the logged in user
  const currentUser = await GetUserData();
  if (comment.user && comment.user.id === currentUser.id) {
    // Show delete button and bind the click event
    const deleteButton = clone.querySelector('#delete-comment-button');
    deleteButton.style.display = 'block';
    deleteButton.addEventListener('click', handleDeleteComment.bind(this, comment.id));
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

async function handleDeleteComment(commentId) {
  // Hide delete button and show confirmation button
  document.querySelector(`.comment[data-id="${commentId}"] #delete-comment-button`).style.display = 'none';
  document.querySelector(`.comment[data-id="${commentId}"] #delete-comment-confirmation`).style.display = 'block';

  document.querySelector(`.comment[data-id="${commentId}"] #delete-comment-confirmation`).addEventListener('click', async function() {
    // Delete comment from Xano
    const response = await fetch(`https://x8ki-letl-twmt.n7.xano.io/api:FaycGcla/spot_comment/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('AuthToken')
      }
    });

    const result = await response.json();

    if (response.status === 200) {
      // Remove comment element from the DOM
      document.querySelector(`.comment[data-id="${commentId}"]`).remove();
    } else {
      console.error('Failed to delete comment:', result);
    }
  });
}

let form = document.getElementById('wf-form-spot-comment-form');
let params = new URLSearchParams(window.location.search);
let spot_id = params.get('id');

form.addEventListener('submit', function(event) {
  event.preventDefault();
  let text = document.getElementById('name').value;

  GetUserData().then(currentUser => {
    fetch('https://x8ki-letl-twmt.n7.xano.io/api:FaycGcla/spot_comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        spot_id: spot_id,
        text: text,
        user_id: currentUser.id,
        user_name: currentUser.username
      }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
      document.getElementById('name').value = '';
      let currentDate = new Date();
      let formattedDate = currentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

      generateCommentElement({
        id: data.id,
        created_at: currentDate,
        text: text,
        user: currentUser
      }, false).then(newComment => {
        const commentContainer = document.getElementById('comment-container');
        commentContainer.prepend(newComment);
      });
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  });
});
