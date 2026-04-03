import Link from 'next/link'
import React from 'react'

const PrivacyPolicy = (): React.ReactNode => {
  return (
    <div className="flex flex-col gap-4 p-8">
      <h5 className="text-2xl font-normal">Email Privacy Policy</h5>
      <p>
        This Privacy Policy describes how your personal information is collected, used, and shared when you visit{' '}
        <Link href="/">https://email.dbowland.com</Link> (the &quot;Site&quot;).
      </p>
      <h6 className="text-xl font-medium">PERSONAL INFORMATION WE COLLECT</h6>
      <p>
        When you visit the Site, we automatically collect certain information about your device, including information
        about your web browser, IP address, time zone, and some of the cookies that are installed on your device.
        Additionally, as you browse the Site, we collect information about the individual web pages or products that you
        view, what websites or search terms referred you to the Site, and information about how you interact with the
        Site. We refer to this automatically-collected information as &quot;Device Information.&quot;
      </p>
      <div>
        We collect Device Information using the following technologies:
        <ul>
          <li>
            &quot;Cookies&quot; are data files that are placed on your device or computer and often include an anonymous
            unique identifier. For more information about cookies, and how to disable cookies, visit{' '}
            <Link href="https://www.allaboutcookies.org">https://www.allaboutcookies.org</Link>.
          </li>
          <li>
            &quot;Log files&quot; track actions occurring on the Site, and collect data including your IP address,
            browser type, Internet service provider, referring/exit pages, and date/time stamps.
          </li>
        </ul>
      </div>
      <p>
        When we talk about &quot;Personal Information&quot; in this Privacy Policy, we are talking about Device
        Information.
      </p>
      <h6 className="text-xl font-medium">HOW DO WE USE YOUR PERSONAL INFORMATION?</h6>
      <p>
        We use the Device Information that we collect to help us screen for potential risk and fraud (in particular,
        your IP address), and more generally to improve and optimize our Site (for example, by generating analytics
        about how our customers browse and interact with the Site, and to assess the success of our marketing and
        advertising campaigns).
      </p>
      <p>We do not share your Personal Information with third parties except in the extreme cases defined below.</p>
      <p>
        Finally, we may share your Personal Information to comply with applicable laws and regulations, to respond to a
        subpoena, search warrant or other lawful request for information we receive, or to otherwise protect our rights.
      </p>
      <h6 className="text-xl font-medium">DO NOT TRACK</h6>
      <p>
        Please note that we do not alter our Site&apos;s data collection and use practices when we see a Do Not Track
        signal from your browser.
      </p>
      <h6 className="text-xl font-medium">YOUR RIGHTS</h6>
      <p>
        If you are a European resident, you have the right to access personal information we hold about you and to ask
        that your personal information be corrected, updated, or deleted. If you would like to exercise this right,
        please contact us through the contact information below. Additionally, if you are a European resident we note
        that we are processing your information in order to fulfill contracts we might have with you (for example if you
        make an order through the Site), or otherwise to pursue our legitimate business interests listed above. Further,
        please note that your information will be transferred outside of Europe, including to the United States.
      </p>
      <h6 className="text-xl font-medium">DATA RETENTION</h6>
      <p>
        We may maintain log files for up to 90 days. If you request data you entered into the site to be deleted, it
        will be removed within 30 days of your request.
      </p>
      <h6 className="text-xl font-medium">MINORS</h6>
      <p>The Site is not intended for individuals under the age of 18.</p>
      <h6 className="text-xl font-medium">CHANGES</h6>
      <p>
        We may update this privacy policy from time to time in order to reflect, for example, changes to our practices
        or for other operational, legal or regulatory reasons.
      </p>
      <h6 className="text-xl font-medium">CONTACT US</h6>
      <p>
        For more information about our privacy practices, if you have questions, or if you would like to make a
        complaint, please contact us by e-mail at <Link href="mailto:privacy@dbowland.com">privacy@dbowland.com</Link>{' '}
        or by mail using the details provided below:
      </p>
      <p>dbowland.com Privacy Department, P.O. Box 81226, Seattle, WA, 98108-1226</p>
    </div>
  )
}

export default PrivacyPolicy
