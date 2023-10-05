# CHARITEE - Back-end

This is backend server for the website I made for my capstone project in the web-fullstack course. The website was developed with the purpose of helping charitable organizations collect donations from the community conveniently and quickly. At the same time, Charitee also helps users find ongoing charities and participate in charitable activities.

This repository only includes the back-end part of my website. You can visit the front-end part [here](https://github.com/khangnguyen213/Charitee_FE).

Technologies I used include:

- NodeJS
- ExpressJS framework

I also used:

- SendGrid (for sending verification email)
- bcryptjs
- jsonwebtoken
- MongoDB (using Mongoose)
- Paypal

The design of this website I gathered from the internet and not from my idea.

## Installation

Use the package manager npm to install necessary dependencies.

```bash
npm install
```

Run the website in your local

```bash
npm start
```

## Usage

<h3>ROUTES MAP</h3>

<table>
  <tr>
    <th>Path</th>
    <th>Method</th>
    <th>Param</th>
    <th>Description</th>
  </tr>
   <tr>
    <td>/account/login</td>
    <td>post</td>
    <td>
      Body:
      <ul>
      <li>email</li>
      <li>password</li>
    </ul>
    </td>
    <td>
       <ul>
      <li>Login</li>
    </ul>
    </td>
  </tr>

  <tr>
    <td>/cause</td>
    <td>get</td>
    <td>
      Query:
      <ul>
      <li>[keyword]</li>
      <li>[causeID]</li>
    </ul>
    </td>
    <td>
       <ul>
      <li>Find all causes if no params</li>
      <li>If keyword is defined, filter causes for matched results</li>
      <li>If causeID is defined, get the detail information of that cause</li>
    </ul>
    </td>
  </tr>
  <tr>
    <td>/cause</td>
    <td>post</td>
    <td>
      Body:
      <ul>
      <li>title (Title of the cause you want to raise fund for)</li>
      <li>description (Tell more about the cause)</li>
      <li>goal (The target money you want to raise)</li>
      <li>raised (The amount of money you raised up to now)</li>
      <li>finishAt (Deadline for donation)</li>
      <li>image (link for image to describe the cause)</li>
    </ul>
    </td>
    <td>
       <ul>
      <li>Create a new cause for the website to raise fund</li>
    </ul>
    </td>
  </tr>
  <tr>
    <td>/cause</td>
    <td>put</td>
    <td>
      Body:
      <ul>
      <li>[description]</li>
      <li>[goal]</li>
      <li>[finishAt]</li>
      <li>[image]</li>
    </ul>
    </td>
    <td>
       <ul>
      <li>Update a cause already save in database</li>
    </ul>
    </td>
  </tr>
    <tr>
    <td>/cause/delete</td>
    <td>post</td>
    <td>
      - causeID
    </td>
    <td>
       <ul>
      <li>Delete a cause already save in database (change status into "inactive"</li>
    </ul>
    </td>
  </tr>
  <tr>
    <td>/account</td>
    <td>get</td>
   <td>
      Query:
      <ul>
      <li>[keyword]</li>
      <li>[accountID]</li>
    </ul>
    </td>
    <td>
       <ul>
      <li>Find all account if no params (only Admin or Master)</li>
      <li>If keyword is defined, filter causes for matched results (only Admin or Master)</li>
      <li>If accountID is defined, get the detail information of that account (only the owner of the matched account can see)</li>
    </ul>
    </td>
  </tr>
    <tr>
    <td>/account/[accountID]</td>
    <td>put</td>
 <td>
      Body:
      <ul>
      <li>fullname</li>
      <li>phone</li>
      <li>address</li>
    </ul>
    </td>
    <td>
       <ul>
      <li>Update an account already created in the database</li>
    </ul>
    </td>
  </tr>
   <tr>
    <td>/account</td>
    <td>post</td>
 <td>
      Body:
      <ul>
      <li>email</li>
      <li>password</li>
      <li>fullname</li>
      <li>phone</li>
      <li>address</li>
      <li>role</li>
      <li>status</li>
    </ul>
    </td>
    <td>
       <ul>
      <li>Create a new account</li>
    </ul>
    </td>
  </tr>
 <tr>
    <td>/account/delete</td>
    <td>post</td>
    <td>
      - accountID
    </td>
    <td>
       <ul>
      <li>Delete a account already save in database (change status into "inactive"</li>
    </ul>
    </td>
  </tr>
  <tr>
<tr>
    <tr>
    <td>/donations</td>
    <td>get</td>
    <td>
      Query:
      <ul>
      <li>[keyword]</li>
      <li>[accountID]</li>
    </ul>
    </td>
    <td>
       <ul>
      <li>Find all causes if no params</li>
      <li>If keyword is defined, filter donations/donators for matched results (only Admin and Master)</li>
      <li>If accountID is defined, get the detail transaction history of that account (only owner of that account can see_</li>
    </ul>
    </td>
  </tr>
</table>

The data will be displayed in the [demo](https://charitee-fe.vercel.app/) link

This repository is BE only, you can see the source code of FE [here](https://github.com/khangnguyen213/Charitee_FE).

## Demo

Link: [demo](https://charitee-be.vercel.app)
