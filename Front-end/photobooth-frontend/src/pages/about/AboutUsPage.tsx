import React from 'react'
import { useNavigate } from 'react-router-dom'
import PublicLayout from '@/components/layouts/PublicLayout'
import './AboutUsPage.css'

const teamMembers = [
  {
    name: 'Thế Khánh',
    role: 'CO-FOUNDER & PRODUCT LEAD',
    description: 'Xuất thân là một chàng trai IT, bên cạnh những dòng code thì anh còn rất hứng thú với những điều mới mẻ và đang trending trong cuộc sống. Ý tưởng photobooth từ đó mà ra, ngoài việc mong muốn đem tới một làn sóng gìn giữ trí nhớ, anh cũng mong muốn đem tới trải nghiệm tuyệt vời thông qua KH Booth.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD165cJA01ImyuxpJMg-j3cKqinq7bmHm67Hs3QFE2DZMBmOurQUAZmfQ-OEqiFhd4Xu3PD5lK1EN9MMUh8uTdjUqUCJskXVCuXDxQloHmJ7DaQ4g9tgzvX-GfvP3YOuNk_Rd5o2Slj5_E2j62jDaStVDiIbJFmftZY2Ai5DUIplisq4R9ndnDVf3wEEU1ulHGakPJiuO5LcQgLIW6r3sVze93TMt7CgvgPt423LzHgzK9BILT1-t_eilnK5NadxWgKavY',
  },
  {
    name: 'Văn Hinh',
    role: 'CO-FOUNDER & TECH LEAD',
    description: 'Là một chàng trai IT với sự nhiệt huyết về công nghệ, anh rất hứng thú với với các công nghệ mới đặc biệt là những công nghệ gắn liền với Gen Z. Qua đó với dự án lần này, anh đặt sự tâm huyết và nhiệt huyết của một người trẻ mong muốn đem lại trải nghiệm tốt nhất đến với các bạn khách hàng.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAhmoIGnYHjgM3JjBOgX7N2paTnHFmIFqp5fPS2WwRNel2zkTLkxbv9yxQetCMhUIMwsjr4VBVGyUMRT8ddTMmoZY80BGqX7SCVMYce24SCgxQHvKZdYoM3ad0GpPITvrMw1ccR2G0IKzmrKpYP9jIh2UEkEMgIp4UW96t99IdWuLIVXbYsA_QR1JUkPX57TKSSbBPNOzZht4F6Sqa4ehcDB-wfrzR82pw7frIxva53rHOEHn-dLQEkB1fXURCqm5txFU',
  },
]

const AboutUsPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <PublicLayout>
      <div className="about-page">
        <div className="about-noise" aria-hidden="true" />
        <main>
        <section className="about-hero">
          <div><p className="about-kicker"><span /> ABOUT US / KH BOOTH</p><h1>Nơi những<br /><em>khoảnh khắc</em><br />ở lại.</h1></div>
          <div className="about-intro"><p>KH Booth được thành lập năm 2026 với sứ mệnh trở thành một công cụ giúp mọi người gắn kết lại với nhau, dù ở bất kỳ đâu, và lưu giữ những kết nối ấy thông qua một bức hình.</p><span className="about-arrow">↓</span></div>
        </section>

        <section className="about-story"><div className="about-story-label"><span>01</span><span>OUR STORY</span></div><div className="about-story-copy"><h2>Một hệ thống trẻ,<br /><em>một tinh thần thật.</em></h2><p>Được xây dựng bởi hai người trẻ yêu công nghệ và yêu những câu chuyện phía sau mỗi tấm ảnh, KH Booth mang đến một không gian thân thiện để mọi người cùng tạo ra kỷ niệm.</p></div><div className="about-stamp">MADE WITH<br /><strong>✦</strong><br />CARE · 2026</div></section>

        <section className="about-proof"><div className="about-section-heading"><div><p className="about-kicker">02 / WHY KH BOOTH</p><h2>Đơn giản để bắt đầu.<br /><em>Đáng nhớ để quay lại.</em></h2></div><p className="about-proof-intro">Mỗi lựa chọn trong KH Booth đều hướng đến một trải nghiệm chụp vui, rõ ràng và gần gũi cho mọi người.</p></div><div className="about-proof-grid"><article className="about-proof-item"><span>01</span><h3>Bắt đầu trong vài giây</h3><p>Giao diện trực quan giúp bạn vào phòng, chọn chế độ và sẵn sàng chụp mà không cần thao tác rườm rà.</p></article><article className="about-proof-item"><span>02</span><h3>Gắn kết dù ở bất kỳ đâu</h3><p>Tạo không gian để bạn bè cùng tham gia, cùng cười và cùng lưu lại khoảnh khắc đáng nhớ.</p></article><article className="about-proof-item"><span>03</span><h3>Kỷ niệm thuộc về bạn</h3><p>Những bức ảnh được tạo ra để dễ dàng lưu giữ và chia sẻ theo cách riêng của bạn.</p></article></div></section>

        <section className="about-team"><div className="about-section-heading"><div><p className="about-kicker">03 / THE PEOPLE</p><h2>Hai người đứng<br /><em>sau ống kính.</em></h2></div><p className="about-proof-intro">Một sản phẩm tốt bắt đầu từ sự quan tâm đến từng chi tiết và người sử dụng nó.</p></div><div className="about-team-grid">{teamMembers.map((member, index) => <article className="about-member" key={member.name}><div className="about-member-photo"><img src={member.image} alt={`Ảnh ${member.name}`} /><span>0{index + 1}</span></div><div className="about-member-info"><h3>{member.name}</h3><p className="about-role">{member.role}</p><p>{member.description}</p></div></article>)}</div></section>

        <section className="about-connect"><div><p className="about-kicker">04 / STAY CONNECTED</p><br/><h2>Điều gì đó<br /><em>đẹp đang đến.</em></h2></div><div className="about-connect-copy"><p>Theo dõi hành trình của KH Booth và chia sẻ những khoảnh khắc của bạn cùng chúng mình.</p><div className="about-socials"><a href="https://www.facebook.com" target="_blank" rel="noreferrer">Facebook <span>↗</span></a><a href="https://www.instagram.com" target="_blank" rel="noreferrer">Instagram <span>↗</span></a><a href="mailto:hello@khbooth.vn">Email <span>↗</span></a></div></div></section>

        <section className="about-cta"><div><p className="about-kicker">YOUR NEXT MEMORY</p><h2>Sẵn sàng tạo một<br /><em>kỷ niệm mới?</em></h2></div><button onClick={() => navigate('/')} className="about-cta-button">CHỤP NGAY <span>↗</span></button></section>
        </main>
      </div>

    </PublicLayout>
  )
}

export default AboutUsPage