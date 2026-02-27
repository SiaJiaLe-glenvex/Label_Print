**# Label_Print**
Print label directly from ELMS to label printer with bypassing the configuration log.


Use Zoho Creator page widget by importing zip file containing the HTML and JavaScript file which fetch the information from Label_Queue_Print_Report records. Each record in the 

When user input the printing information, the information for each label will be stored as a record in the Label_Queue_Print_Report.

Label_Queue_Print_Report represents one label. 

Function of HTML and JavaScript is to format the label and add the information accordingly and print the label.

Open Zoho Creator in Microsoft Edge Kiosk mode and perform printing through silent printing.

**Steps to do:**
1. Setup Microsoft Edge Silent Printing.

2. Setup zoho widget using command prompt with the respective html, javascript, and json file.

3. Create a widget and insert the zip file in zoho creator.

4. Create a page and insert the widget into the page.



**A. Setup Microsoft Edge Silent Printing:**

1. On your window, right click and select New. Under New, select Shortcut.

2. Under “Type the location of the item”, insert the command to create kiosk silent printing. Command: "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk "https://creatorapp.zoho.com/kelvinkhoo_glenvex/staging-elms#Form:Print_Labels_2" --edge-kiosk-type=fullscreen --no-first-run --kiosk-printing                                                        Remark: Replace the link with the zoho user link that the plant will be using.

3. Click Next. Then, give a name for the shortcut.

4. Click on Finish. Then, it will appear on your window. Open it, and you can access to the system in kiosk mode with silent printing.



**B. Setup Zoho Widget using command prompt:**

1. Install Zet-CLI package (Command: npm install zet-cli)

2. Run zet init. Then, choose zoho creator. Click enter.

3. Create a project by giving the project a name.

4. Cd into the project directory and run zet run. Click on the https url and click advanced. Then, click proceed (unsafe).

5. Go to your folder and look for the project folder you have created according to the directory. You shall see the folders as in the image below.

6. Use any IDE such as VS code to open the project folder.

7. In the app folder, edit the widget.html file. Also, create a widget.js file and insert the glenvex.png image for logo in the same folder.

8. Under the project folder, edit the plugin-manifest.json file so that it is compatible with your zoho creator printing feature.

9. Save all the changes. After that, return to command prompt, under the same directory, run zet validate.
  
11. If validation succeeded, run zet pack. The zip folder will appear under the dist folder in the project folder.

12. The widget is then setup. 

**More details can watch the video: https://www.bing.com/videos/riverview/relatedvideo?q=zoho+widget+setup&mid=D86B7CDB1556BF7BB308D86B7CDB1556BF7BB308&churl=https%3a%2f%2fwww.youtube.com%2fchannel%2fUCM5RHniuUSXDOh1WHbWm23A&FORM=VIRE**

**Remark: Every time you make any changes to the html, javascript, and Json file, you have to run zet validate and zet pack to create a new zip file with the latest version of the code then upload it into zoho creator again. Below section will guide how to insert the zip file into zoho creator widget.**

**C. Create a widget and insert the zip file in zoho creator:**

1. In zoho creator, click edit this application. Under Settings, under Developer Tools, click Widgets.

2. Click New Widget → Upload File.

3. Give the widget a name, then click on the upload file. 

4. Select the zip file under dist folder in the project folder.

5. For index file, write the name of the html file in the app folder. For example, mine is widget.html in app folder so write /widget.html. 

6. Then click Create.

7. Create a page and insert the widget into the page. Click on Widgets. Under Custom, drag the widget you created into the page.

8. Then save and click done.


**Congratulations. Everything is Setup!!!**
