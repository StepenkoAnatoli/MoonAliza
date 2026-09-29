---
url: https://www.youtube.com/watch?v=p7aOmRJ0qcY
retrieved: 2026-09-29
command: firecrawl scrape https://www.youtube.com/watch?v=p7aOmRJ0qcY --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: GitHub Actions - Masking Variables and Secrets - YouTube
---
![Thumbnail (1920x1080)](https://i.ytimg.com/vi/p7aOmRJ0qcY/maxresdefault.jpg)
# [GitHub Actions - Masking Variables and Secrets](https://www.youtube.com/watch?v=p7aOmRJ0qcY)

**Visibility**: Public
**Uploaded by**: [Mickey Gousset](https://www.youtube.com/@MickeyGousset)
**Uploaded at**: 2025-03-07
**Published at**: 
**Length**: 09:49
**Views**: 1395
**Likes**: 48
**Category**: Science & Technology

## Description

```
This video is part 12 in my Introduction to GitHub Actions video series. 

In this video you are going to learn how mask variables and secrets. Let me give you a great scenario of why and when you would use this:

Let's say instead of storing secrets in the GitHub Secret store, you want to use something else, like Azure KeyVault.  In your Actions workflows, you will be retrieving secrets from the vault. But how do you make sure these secrets don't get accidentally written in the Actions log as plain text?  That is where masking comes in.  Using the "add-mask" function, you can "mask" the variables/secrets, where you can still use them in your workflow, but if they are written out to the log file, all that is written is ***

This video will also be helpful in preparing for the GitHub Actions certification exam.

Demo Repo: https://github.com/devopselvis/my-github-actions-presentation

============================================================

🕔 TIMESTAMPS
0:00 Intro 
0:49 Masking Demo
8:45 Wrap-up

============================================================

🎥 INTRODUCTION TO GITHUB ACTIONS VIDEO SERIES
▶️ Part 1 - Your First GitHub Actions Workflow - https://youtu.be/xZyeAWawyVk
▶️ Part 2 - Chaining Jobs Together In A Workflow - https://youtu.be/4A1g8tyKPi4
▶️ Part 3 - The GitHub Context Object and Variables - https://youtu.be/nNItXK3xd2s
▶️ Part 4 - The GitHub Marketplace - https://youtu.be/JYOGmLzMbpM
▶️ Part 5 - Run A Workflow Against A Pull Request - https://youtu.be/ClLKbB_59Ec
▶️ Part 6 - Repository Rulesets - https://youtu.be/ZTbM-h9RZOo
▶️ Part 7 - Deploy Your App Using GitHub Actions - https://youtu.be/_NPY3wGHnK4
▶️ Part 8 - Create Your First Custom GitHub Action - https://youtu.be/zQdEsIBbVjE
▶️ Part 9 - Create Your First Reusable Workflow - https://youtu.be/gDBZGCGSs6E
▶️ Part 10 - Concurrency - https://youtu.be/JhBCHRtKcik
▶️ Part 11 - Trigger on a Custom Event - https://youtu.be/TmuqKFdh6kw
▶️ Part 12 - Masking Variables and Secrets - https://youtu.be/p7aOmRJ0qcY

===========================================================

🌐 FIND ME
👉 Blog: https://mickeygousset.com
👉 GitHub: https://github.com/mickeygousset
👉 Twitter:  https://twitter.com/mickey_gousset
```

## Transcript

hey y'all I'm Mickey gusay today we're
diving into a crucial topic for keeping
your workflows secure masking variables
using the add mask function in GitHub
actions I want to thank YouTuber Seattle
synth for bringing up this topic as a
question on my introduction to GitHub
actions part three video I'll throw a
link up somewhere around here to that
video for
you hey come
thanks for checking out my channel and
videos if you're new here don't forget
to like this video hit that subscribe
button and ring the bell to stay updated
on all things GitHub devops and AI I
really appreciate
it okay let's get to
it okay let's look at some examples of
using the ad mask function so here we
are in my my GitHub actions presentation
rep repository this is the repository
that has all of my or most of my GitHub
actions
presentations Demos in it it's also an
public
repository so you're welcome to clone it
or you're welcome to Fork it you're
welcome to submit suggestions back to it
all of that you can find it at
github.com devops Elvis slm my- GitHub D
actions Das presentation
so the first thing we're going to do is
look at a workflow that I created that
has several examples of using the ad
mask function in it and then we
will run the workflow and look at the
results so if we go into the GitHub
folder and we go into the workflows
folder there's a workflow there called
masking
variables and if we look at this
workflow it has you know starts off as
normal has a display name name we're
running it on workflow dispatch so that
we can manually run it and then the
workflow is going to have several
different jobs in it the first job is
going to be a simple example of masking
a string so what we're going to do in
this job is take a string that we've
just hardcoded called super secret
password 123 and we're going to add a
mask to it and you do that by by doing
using Echo you do an echo and you say
colon colon add- mask colon colon and in
this case the string value so now
anytime we try to Output that string
value to the log file so for example by
saying Echo this is my password super
secret password 1 23 because we masked
that string when you try to write it to
the log file it's going to show up as
asteris as stars now you can still use
this string in your code and in your
code code it will work fine but if you
try to Output it to the log file it's
going to show up as
stars so let's take this one step
further right and let's look at how we
could mask an environment
variable so in this case we have a job
demo environment variable masking and
what we're doing is creating an
environment
variable called my secret and we're
setting it to a value top secret value
in the step again we're using colon
colon add- mask colon colon and this
time instead of a
hard-coded string we're saying mask the
environment variable myor
secret and now when we output that
environment variable it should write out
stars for us again the value of the
variable is still there it can still be
used in your
workflow but if it gets written out it
gets written out as a mass value in this
case
asterisk the next demo is going to show
Dynamic masking and what I mean by
Dynamic masking is we're going to have
two steps the first step's going to
actually grab a secret from somewhere
let's say or create the variable for us
and mask it and then we're going to
Output that to the The Next Step so that
we have the ability to use that value
but if we try to write out to the log it
would be
masked so in this case we've got this
first step called secret Das step we're
generating just a random value called
Dynamic
secret then we're saying colon colon
add- mask colon colon Dynamic secret to
mask that value and then we want to take
that variable and out set it as a step
output so we can use it in future
variables so we're going
to say Echo generated secret that's
going to be our output variable name
we're going to set it equal to the value
of whatever is in Dynamic secret and
then we send that over to GitHub output
and this creates a step output variable
for us I've got a whole video
on variables and doing step variables
and job variables I'll put a link
somewhere around here for you to find
it so but what this does is it outputs
from this step an output variable called
generated secret that generated secret
has whatever this value was that was
created but it's also massed so that now
in this next step if I try to Output it
by saying doign curly brace curly brace
steps dot secret step. outputs.
generated
Secret in instead of writing out the
value of what's in generated secret it's
going to write out asteris but what this
does is it shows you how you can go
retrieve something in a step mask it and
then share that with other steps in your
job or you could even create job output
variables and share it with other jobs
in your
workflow and
finally how do you mask a multi-line
variable so in this case I've got a
variable that has some Carriage returns
in it so it's a multi-line variable it's
got three different
lines so you kind of have to
to hack around a little bit in this case
what I'm doing is outputting each line
and getting each line and masking each
individual
line so that will mask each line in that
multi-line secret variable and so now if
I try to Echo out that multi-line secret
variable each line should show up as
stars
so let's actually run
this and see how this might work so
we'll come back over to the actions tab
we'll go to the masking
variables and we will say run
workflow this workflow won't take take
that long to run again I'm using hosted
Runners and because I have all four jobs
and there's no need statements in
between the jobs it will try to run the
jobs in parallel if it can in this case
it did and you can see all of the jobs
have
finished so if we look at the first job
if you'll remember the first job
was just masking that value super secret
password 123 and you can see here that
it did indeed when I tried to Output it
it only wrote out
stars with the environment variable this
is where we created an environment
variable and we were masking the my
secret environment
variable and again it just wrote out
Stars the dynamic masking that's where
in this step we were
generating a secret and then masking it
and setting it as an output and then we
tried to Output that in this step and as
you can
see asteris all the
way and finally this was the multi-line
masking where we were trying to mask
that multi-line variable so here's the
multi-line variable as you can
see it masked each line of the
multi-line
variable now what's a real world example
of needing to use this it could be that
you're pulling secrets from say Azure
key Vault and you want to make sure that
those values are available to other
steps and jobs in the workflows but in a
secure way using the ad mask function
makes it where those values won't show
up in the action log files inherently
making things more
secure remember folks always mask your
sensitive Data before it appears in any
logs it's a good practice to apply
masking as early as possible in your
workflow that's all for today's video on
masking variables in GitHub actions if
you found this video helpful smash that
like button and share it with your
fellow GitHub people do you have any
questions or topics you'd like me to
cover next drop them in the comments
below thanks for watching
