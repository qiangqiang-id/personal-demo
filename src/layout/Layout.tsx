import { Layout, Menu, MenuProps, theme } from 'antd'
import { Outlet, useNavigate } from 'react-router-dom'
import Routes from '@/config/Routes'
import Style from './Layout.module.less'

const { Header, Content, Sider } = Layout

type MenuItem = Required<MenuProps>['items'][number]

function getItems(): MenuItem[] {
  return Object.values(Routes).map((item) => {
    const { path, label } = item
    return { key: path, label }
  })
}

const items: MenuItem[] = getItems()

function LayoutComponent() {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const navigateTo = useNavigate()

  return (
    <Layout style={{ height: '100%' }}>
      <Sider className={Style.sider}>
        <div className="demo-logo-vertical" />
        <Menu
          onSelect={(val) => {
            navigateTo(val.key)
          }}
          theme="light"
          mode="inline"
          defaultSelectedKeys={[Routes.RichTextInsertBlock.path]}
          items={items}
        />
      </Sider>
      <Layout>
        <Header
          className={Style.header}
          style={{ background: colorBgContainer }}
        >
          小强技术预研demo
        </Header>
        <Content style={{ margin: '24px 16px' }}>
          <div
            className={Style.content}
            style={{
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default LayoutComponent
